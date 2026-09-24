// Text contrast + minimum-size audit.
//
//   node scripts/audit/a11y-contrast.mjs [baseUrl] [outDir] [--widths=375,1440]
//
// For each width the page is walked through a series of scroll states (every
// section in ~0.8-viewport steps, Experience at 11 survey positions, all four
// Projects tabs). In each state every visible text node that is on screen is
// recorded with its computed font-size, rendered size (after ancestor
// transforms such as Experience's --fit and the hero stage scale), weight,
// letter-spacing, family, colour and effective opacity.
//
// Two background measurements per text node:
//   walk   the brief's method: ancestors up to the first opaque background,
//          alpha-blending translucent layers. Gradient layers are expanded to
//          their colour stops, giving a light-stop and a dark-stop result; any
//          background-image on the way marks the result approximate.
//   pixel  a viewport screenshot taken with all text (and currentColor) made
//          transparent, sampled over the text node's own client rects. This
//          sees what the walk cannot: absolutely positioned glows, grids and
//          images behind the text, blend modes, backdrop blur.
// Foreground = colour alpha x effective opacity composited over the background.
// Pass/fail uses the pixel median; the p10 and the walk figures are reported
// alongside. Raw records -> <outDir>/contrast-<width>.json.
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const [baseUrl = 'http://127.0.0.1:5199/', outDir = 'docs/overhaul/audit/a11y'] = positional;
const widthsArg = args.find((a) => a.startsWith('--widths='));
const widths = widthsArg ? widthsArg.split('=')[1].split(',').map(Number) : [375, 1440];
const HEIGHTS = { 375: 812, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HIDE_TEXT_CSS = `
  *, *::before, *::after {
    color: transparent !important;
    -webkit-text-fill-color: transparent !important;
    text-shadow: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  svg text, svg tspan { fill: transparent !important; stroke: transparent !important; }
`;

// ---------------------------------------------------------------- colour math
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const over = (fg, alpha, bg) => [0, 1, 2].map((i) => fg[i] * alpha + bg[i] * (1 - alpha));
const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const pct = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
};

// ---------------------------------------------------- in-page text collector
function collectInPage(stateName) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cache = (window.__a11yColorCache ??= new Map());
  const cv = (window.__a11yCanvas ??= new OffscreenCanvas(1, 1));
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const toRGBA = (str) => {
    if (cache.has(str)) return cache.get(str);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = str;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const out = [d[0], d[1], d[2], d[3] / 255];
    cache.set(str, out);
    return out;
  };
  const colorTokens = (s) =>
    s.match(/rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-fA-F]{3,8}\b|transparent/g) ?? [];
  const L = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const blend = (top, base) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + base[i] * (1 - a));
  };

  const pathOf = (el) => {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && n !== document.body) {
      const p = n.parentElement;
      const idx = p ? Array.prototype.indexOf.call(p.children, n) : 0;
      parts.unshift(`${n.tagName.toLowerCase()}:${idx}`);
      n = p;
    }
    return parts.join('/');
  };

  const has = (el, sel) => Boolean(el.closest(sel));
  const component = (el) => {
    if (has(el, 'nav')) return 'NavRail';
    const sec = el.closest('section');
    if (!sec) return has(el, 'footer') ? 'Footer' : 'other';
    const id = sec.id;
    if (has(el, 'h2')) return 'SectionHeading h2';
    if (has(el, 'p[class*="mt-7"][class*="text-center"]')) return 'SectionHeading caption';
    if (id === 'hero') {
      if (has(el, '[class*="xl:block"][aria-hidden="true"]')) return 'Hero stage (aria-hidden scene)';
      if (has(el, '[aria-hidden="true"][class*="max-w-[560px]"]')) return 'Hero IDE frame (aria-hidden)';
      if (has(el, 'header')) return 'Hero header lockup';
      if (has(el, 'dl')) return 'Hero proof strip';
      if (has(el, 'footer')) return 'Hero footer';
      if (has(el, '[class*="xl:flex"][aria-hidden="true"]')) return 'Hero side triad (aria-hidden)';
      if (has(el, 'a')) return 'Hero CTA';
      return 'Hero copy';
    }
    if (id === 'experience') {
      if (has(el, '[data-card-index]')) {
        if (has(el, '[class*="border-t"][class*="mx-[18px]"]')) return 'Exp HudCard footer caption';
        if (has(el, 'h3')) return 'Exp HudCard title';
        if (has(el, 'p')) return 'Exp HudCard body';
        if (has(el, '[class*="rounded-[5px]"]')) return 'Exp HudCard tag';
        return 'Exp HudCard header';
      }
      if (has(el, '[class*="w-[148px]"]')) return 'Exp SpecBlock (aria-hidden)';
      if (has(el, '[class*="top-[30px]"]')) return 'Exp HUD readout';
      if (has(el, '[class*="bottom-[52px]"]')) {
        if (has(el, '[class*="font-display"]')) return 'Exp title block company';
        return 'Exp title block / dates / education';
      }
      if (has(el, '[class*="aspect-[2108/424]"]')) return 'Exp AirframeNotes (aria-hidden)';
      return 'Exp SheetMarks (aria-hidden)';
    }
    if (id === 'projects') {
      if (has(el, 'button')) return 'Proj station tab';
      if (has(el, '.order-1')) {
        if (has(el, '[class*="border-b"][class*="justify-between"]')) return 'Proj title block (station / FIG)';
        return 'Proj visual (mock UI)';
      }
      if (has(el, 'a')) return 'Proj link button';
      if (has(el, 'h3')) return 'Proj h3';
      if (has(el, '[class*="rounded-full"][class*="px-[11px]"]')) return 'Proj stack chip';
      return 'Proj copy / labels';
    }
    if (id === 'skills') {
      if (has(el, '.skill-detail')) return 'Skills Detail A-A panel';
      if (has(el, '.skill-note')) return 'Skills tile subtitle (note)';
      if (has(el, '.skill-chip')) return 'Skills tile name';
      return 'Skills tally row';
    }
    if (id === 'contact') {
      if (has(el, 'button')) return 'Contact copy button';
      if (has(el, 'a[href^="mailto"]')) return 'Contact send button';
      if (has(el, '.contact-handle')) return 'Contact channel handle';
      if (has(el, '.contact-card')) return 'Contact card label/name';
      return 'Contact other';
    }
    return id || 'other';
  };

  const effOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      o *= parseFloat(cs.opacity);
      if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
    }
    return o;
  };

  const walkBg = (el) => {
    const layers = [];
    const reasons = new Set();
    let base = null;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        const stops = colorTokens(bi).map(toRGBA);
        if (/url\(/.test(bi)) reasons.add('image');
        if (/gradient/.test(bi)) reasons.add('gradient');
        if (stops.length) layers.push({ stops });
      }
      const bc = toRGBA(cs.backgroundColor);
      if (bc[3] >= 0.999) {
        base = bc;
        break;
      }
      if (bc[3] > 0) layers.push({ stops: [bc] });
      if (cs.backdropFilter && cs.backdropFilter !== 'none') reasons.add('backdrop-filter');
    }
    if (!base) base = [10, 13, 19, 1];
    // layers[] is innermost-first; composite outermost-first over the base.
    let hi = base.slice(0, 3);
    let lo = base.slice(0, 3);
    for (let i = layers.length - 1; i >= 0; i--) {
      const cands = layers[i].stops;
      const hiC = cands.map((s) => blend(s, hi));
      const loC = cands.map((s) => blend(s, lo));
      hi = hiC.reduce((a, b) => (L(b) > L(a) ? b : a));
      lo = loC.reduce((a, b) => (L(b) < L(a) ? b : a));
    }
    return { hi, lo, approx: [...reasons] };
  };

  const recs = [];
  const skipped = { offscreen: 0, transparentColor: 0, lowOpacity: 0, tiny: 0 };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  let idx = 0;
  while ((node = tw.nextNode())) {
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || el.closest('script,style,noscript')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    if (!rects.length) continue;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rects) {
      x0 = Math.min(x0, r.left);
      y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right);
      y1 = Math.max(y1, r.bottom);
    }
    const w = x1 - x0;
    const h = y1 - y0;
    if (w < 2 || h < 2) {
      skipped.tiny++;
      continue;
    }
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    if (cx < 0 || cx > vw || cy < 0 || cy > vh) {
      skipped.offscreen++;
      continue;
    }
    const cs = getComputedStyle(el);
    const isSvg = el instanceof SVGElement;
    const colorStr = isSvg ? cs.fill : cs.color;
    const color = toRGBA(colorStr && colorStr !== 'none' ? colorStr : cs.color);
    const strokeOnly = color[3] === 0;
    if (strokeOnly) {
      skipped.transparentColor++;
      recs.push({
        state: stateName, key: pathOf(el) + '#' + idx++, text: text.slice(0, 60), component: component(el),
        decorativeOutline: true, fontPx: parseFloat(cs.fontSize), stroke: cs.webkitTextStrokeColor,
        ariaHidden: Boolean(el.closest('[aria-hidden="true"]')),
      });
      continue;
    }
    const opacity = effOpacity(el);
    if (opacity < 0.05) {
      skipped.lowOpacity++;
      continue;
    }
    const fontPx = parseFloat(cs.fontSize);
    let scale = 1;
    if (isSvg && el.getScreenCTM) {
      const m = el.getScreenCTM();
      if (m) scale = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    } else {
      // Ancestor transforms (scale(), --fit, parallax) shrink the rendered
      // glyphs without changing computed font-size. Compare the element's
      // transformed box to its layout box.
      const br = el.getBoundingClientRect();
      if (el.offsetWidth > 4) scale = br.width / el.offsetWidth;
      else if (el.offsetHeight > 4) scale = br.height / el.offsetHeight;
    }
    const lsRaw = cs.letterSpacing;
    const lsPx = lsRaw === 'normal' ? 0 : parseFloat(lsRaw);
    const fam = cs.fontFamily.toLowerCase();
    const family = /mono/.test(fam) ? 'mono' : /saira/.test(fam) ? 'display' : /grotesk/.test(fam) ? 'grotesk' : /newsreader|serif/.test(fam) && !/sans/.test(fam) ? 'serif' : 'sans';
    const upper = cs.textTransform === 'uppercase' || (/[A-Z]/.test(text) && text === text.toUpperCase());
    const walk = walkBg(el);
    recs.push({
      state: stateName,
      key: pathOf(el) + '|' + text.slice(0, 40),
      section: el.closest('section')?.id ?? (el.closest('nav') ? 'nav' : el.closest('footer') ? 'footer' : 'other'),
      component: component(el),
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').slice(0, 160),
      text: text.slice(0, 80),
      fontPx,
      scale: +scale.toFixed(3),
      renderedPx: +(fontPx * scale).toFixed(2),
      weight: parseInt(cs.fontWeight, 10),
      lsPx: +lsPx.toFixed(2),
      lsEm: +(lsPx / fontPx).toFixed(3),
      family,
      upper,
      color,
      colorHex: '#' + color.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join(''),
      opacity: +opacity.toFixed(3),
      ariaHidden: Boolean(el.closest('[aria-hidden="true"]')),
      rects: rects.map((r) => [r.left, r.top, r.width, r.height].map((v) => +v.toFixed(1))),
      bbox: [x0, y0, w, h].map((v) => +v.toFixed(1)),
      walk,
    });
  }
  return { recs, skipped, scrollY: Math.round(window.scrollY) };
}

// ------------------------------------------------------------------- driver
const browser = await chromium.launch();
await fs.mkdir(outDir, { recursive: true });
const allSummary = {};

for (const width of widths) {
  const height = HEIGHTS[width] ?? 900;
  const mobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(2000);

  const best = new Map(); // key -> record
  const decorative = new Map();
  const skippedTotals = { offscreen: 0, transparentColor: 0, lowOpacity: 0, tiny: 0 };
  let stateCount = 0;

  const snapshot = async (stateName) => {
    const { recs, skipped } = await page.evaluate(collectInPage, stateName);
    for (const k of Object.keys(skipped)) skippedTotals[k] += skipped[k];
    await page.addStyleTag({ content: HIDE_TEXT_CSS }).then((h) => h.evaluate((n) => n.setAttribute('data-a11y-hide', '')));
    await sleep(120);
    const png = await page.screenshot();
    await page.evaluate(() => document.querySelectorAll('style[data-a11y-hide]').forEach((n) => n.remove()));
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;
    const ch = info.channels;
    stateCount++;
    for (const r of recs) {
      if (r.decorativeOutline) {
        decorative.set(r.key, r);
        continue;
      }
      const alpha = r.color[3] * r.opacity;
      const fg = r.color.slice(0, 3);
      const crs = [];
      const bgL = [];
      let area = 0;
      for (const [x, y, w, h] of r.rects) area += Math.max(0, w) * Math.max(0, h);
      const step = Math.max(1, Math.floor(Math.sqrt(area / 2500)));
      let sumBg = [0, 0, 0];
      let n = 0;
      for (const [x, y, w, h] of r.rects) {
        const xa = Math.max(0, Math.floor(x));
        const ya = Math.max(0, Math.floor(y));
        const xb = Math.min(W, Math.ceil(x + w));
        const yb = Math.min(H, Math.ceil(y + h));
        for (let yy = ya; yy < yb; yy += step) {
          for (let xx = xa; xx < xb; xx += step) {
            const o = (yy * W + xx) * ch;
            const bg = [data[o], data[o + 1], data[o + 2]];
            const f = over(fg, alpha, bg);
            crs.push(ratio(f, bg));
            bgL.push(lum(bg));
            sumBg = sumBg.map((v, i) => v + bg[i]);
            n++;
          }
        }
      }
      if (!n) continue;
      const meanBg = sumBg.map((v) => v / n);
      const walkFgHi = over(fg, alpha, r.walk.hi);
      const walkFgLo = over(fg, alpha, r.walk.lo);
      const rec = {
        ...r,
        rects: undefined,
        pixel: {
          median: +pct(crs, 0.5).toFixed(2),
          p10: +pct(crs, 0.1).toFixed(2),
          min: +Math.min(...crs).toFixed(2),
          meanBg: hex(meanBg),
          samples: n,
        },
        walkResult: {
          lightStopBg: hex(r.walk.hi),
          darkStopBg: hex(r.walk.lo),
          crLightStop: +ratio(walkFgHi, r.walk.hi).toFixed(2),
          crDarkStop: +ratio(walkFgLo, r.walk.lo).toFixed(2),
          approx: r.walk.approx,
        },
        walk: undefined,
      };
      const prev = best.get(r.key);
      // Keep the most-revealed sample; among equally revealed ones keep the
      // worst contrast (fixed/sticky elements are seen over several grounds).
      if (
        !prev ||
        rec.opacity > prev.opacity + 0.02 ||
        (Math.abs(rec.opacity - prev.opacity) <= 0.02 && rec.pixel.median < prev.pixel.median)
      ) {
        best.set(r.key, rec);
      }
    }
  };

  const sectionRange = (id) =>
    page.evaluate((sid) => {
      const el = document.getElementById(sid);
      const top = el.getBoundingClientRect().top + window.scrollY;
      return { top, height: el.offsetHeight, vh: window.innerHeight, doc: document.documentElement.scrollHeight };
    }, id);
  const scrollTo = async (y, wait = 1300) => {
    await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, Math.round(y)));
    await sleep(wait);
  };

  // Hero, stepping through its height.
  const stepThrough = async (id, label) => {
    const { top, height, vh } = await sectionRange(id);
    const stops = [];
    for (let y = top; y < top + height - vh * 0.25; y += vh * 0.8) stops.push(y);
    if (!stops.length) stops.push(top);
    for (const [i, y] of stops.entries()) {
      await scrollTo(y);
      await snapshot(`${label}-${i}`);
    }
  };

  await stepThrough('hero', 'hero');

  // Experience survey positions. Approach each from slightly above so the
  // direction-aware snap sees a downward scroll.
  {
    const { top, height, vh } = await sectionRange('experience');
    const travel = height - vh;
    for (const p of [0, 0.05, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88]) {
      const y = top + travel * p;
      await page.evaluate((yy) => window.scrollTo(0, Math.max(0, yy - 40)), Math.round(y));
      await sleep(80);
      await scrollTo(y, 1700);
      await snapshot(`experience-${Math.round(p * 100)}`);
    }
  }

  // Projects: every tab, stepping through the section each time. The click is
  // dispatched from the DOM so no pointer event wakes the cursor torch.
  for (let tab = 0; tab < 4; tab++) {
    const { top } = await sectionRange('projects');
    await scrollTo(top, 900);
    await page.evaluate((t) => document.querySelectorAll('#projects button[type="button"]')[t].click(), tab);
    await sleep(1500);
    await stepThrough('projects', `projects-tab${tab + 1}`);
  }

  await stepThrough('skills', 'skills');
  await stepThrough('contact', 'contact');
  await scrollTo(1e7, 1500);
  await snapshot('bottom');

  const records = [...best.values()];
  const out = { width, height, states: stateCount, skipped: skippedTotals, records, decorativeOutline: [...decorative.values()] };
  await fs.writeFile(path.join(outDir, `contrast-${width}.json`), JSON.stringify(out, null, 2));
  allSummary[width] = { states: stateCount, records: records.length };
  console.log(`done ${width}: states=${stateCount} textNodes=${records.length}`);
  await context.close();
}

await browser.close();
console.log(JSON.stringify(allSummary));
