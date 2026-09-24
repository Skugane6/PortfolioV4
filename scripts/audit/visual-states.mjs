// Visual/UX audit: states the baseline capture does not cover, plus DOM
// measurements the screenshots alone cannot give.
//
//   node scripts/audit/visual-states.mjs [baseUrl] [--only=projects,skills,bottom,navrail,fonts,cat,bands,hover]
//
// Writes PNGs to docs/overhaul/screenshots/before/visual/ and a JSON of the
// measurements to docs/overhaul/screenshots/before/visual/visual-measure.json.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const baseUrl = args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:5199/';
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1].split(',') : null;
const want = (k) => !only || only.includes(k);

const OUT = 'docs/overhaul/screenshots/before/visual';
await fs.mkdir(OUT, { recursive: true });
const HEIGHTS = { 375: 812, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1366: 768, 1440: 900, 1920: 1080 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const measurePath = path.join(OUT, 'visual-measure.json');
let measure = {};
try {
  measure = JSON.parse(await fs.readFile(measurePath, 'utf8'));
} catch {}

const browser = await chromium.launch();

async function open(width, { touch } = {}) {
  const height = HEIGHTS[width] ?? 900;
  const mobile = width < 768;
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: touch ?? mobile,
  });
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1500);
  return { ctx, page, width, height };
}

// Slow scroll through the page so every once-only whileInView entrance fires.
async function prescroll(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
    }
  });
  await sleep(600);
}

async function scrollToId(page, id, offset = 0) {
  await page.evaluate(
    ([sid, off]) => {
      const el = document.getElementById(sid);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off);
    },
    [id, offset],
  );
}

// Injected helper: content elements (text-bearing, images, top-level svgs,
// buttons/links, bordered boxes) with their effective opacity.
const CONTENT_FN = `
window.__content = (root, opts = {}) => {
  const out = [];
  const effOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  };
  const hiddenAria = (el) => !!el.closest('[aria-hidden="true"]');
  const describe = (el) => {
    const t = (el.innerText || el.getAttribute('alt') || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (t ? ' "' + t + '"' : '');
  };
  for (const el of root.querySelectorAll('*')) {
    if (opts.exclude && el.closest(opts.exclude)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const tag = el.tagName;
    const cs = getComputedStyle(el);
    const directText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const isMedia = tag === 'IMG' || tag === 'CANVAS' || tag === 'VIDEO' || (tag === 'svg' && !el.parentElement.closest('svg'));
    const isCtl = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT';
    const bordered = parseFloat(cs.borderTopWidth) > 0 && !/rgba\\([^)]*,\\s*0\\)/.test(cs.borderTopColor) && r.width > 40 && r.height > 30;
    if (!(directText || isMedia || isCtl || bordered)) continue;
    const op = effOpacity(el);
    if (op < 0.05) continue;
    out.push({
      d: describe(el), kind: directText ? 'text' : isMedia ? 'media' : isCtl ? 'control' : 'box',
      ariaHidden: hiddenAria(el), op: +op.toFixed(2),
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY),
    });
  }
  return out;
};`;

// ── 1. Project panels ──────────────────────────────────────────────────
if (want('projects')) {
  measure.projects = {};
  for (const width of [375, 1440]) {
    const { ctx, page } = await open(width);
    await prescroll(page);
    await page.addScriptTag({ content: CONTENT_FN });
    const tabs = page.locator('#projects button[type="button"]');
    const n = await tabs.count();
    measure.projects[width] = [];
    for (let i = 0; i < n; i++) {
      await scrollToId(page, 'projects');
      await sleep(300);
      await tabs.nth(i).click();
      await sleep(1800);
      const name = (await tabs.nth(i).innerText()).split('\n').pop().trim();
      await page.locator('#projects').screenshot({ path: path.join(OUT, `projects-${width}-${i + 1}.png`) });
      // Panel geometry: the keyed grid, its two columns, and the content
      // actually drawn inside the visual column.
      const geo = await page.evaluate(() => {
        const grid = document.querySelector('#projects [class*="xl:min-h-[460px]"]');
        const cols = [...grid.children].map((c) => {
          const r = c.getBoundingClientRect();
          const inner = window.__content(c).filter((e) => e.w < r.width - 4 || e.kind !== 'box');
          const top = Math.min(...inner.map((e) => e.y));
          const bottom = Math.max(...inner.map((e) => e.y + e.h));
          return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), contentTop: top, contentBottom: bottom, deadAbove: top - Math.round(r.top), deadBelow: Math.round(r.bottom) - bottom };
        });
        // The visual's own drawing area (flex centre box) and the visual root inside it.
        const stage = grid.querySelector('[class*="flex-1 items-center justify-center"]');
        const sr = stage.getBoundingClientRect();
        const vis = stage.firstElementChild?.getBoundingClientRect();
        const imgs = [...grid.querySelectorAll('img')].map((im) => ({ alt: im.alt, w: Math.round(im.getBoundingClientRect().width), h: Math.round(im.getBoundingClientRect().height), natural: im.naturalWidth + 'x' + im.naturalHeight }));
        return { cols, stage: { w: Math.round(sr.width), h: Math.round(sr.height) }, visual: vis && { w: Math.round(vis.width), h: Math.round(vis.height), padTop: Math.round(vis.top - sr.top), padBottom: Math.round(sr.bottom - vis.bottom) }, imgs, sectionH: Math.round(document.getElementById('projects').getBoundingClientRect().height) };
      });
      measure.projects[width].push({ i: i + 1, name, ...geo });
    }
    await ctx.close();
  }
}

// ── 2. Skills: hover (pointer) vs tap (touch) ──────────────────────────
if (want('skills')) {
  measure.skills = {};
  for (const [width, touch] of [[1440, false], [1280, false], [1366, true], [768, true], [375, true]]) {
    const { ctx, page } = await open(width, { touch });
    await prescroll(page);
    await scrollToId(page, 'skills', 60);
    await sleep(1200);
    const tile = page.locator('#skills li.skill-tile').nth(2);
    const before = await page.evaluate(() => document.querySelector('#skills aside')?.innerText.replace(/\s+/g, ' ').slice(0, 120) ?? null);
    if (touch) await tile.tap();
    else await tile.hover();
    await sleep(900);
    const after = await page.evaluate(() => {
      const aside = document.querySelector('#skills aside');
      return aside ? { visible: aside.getBoundingClientRect().width > 0 && getComputedStyle(aside).display !== 'none', text: aside.innerText.replace(/\s+/g, ' ').slice(0, 160) } : null;
    });
    await page.screenshot({ path: path.join(OUT, `skills-${width}-${touch ? 'tap' : 'hover'}.png`) });
    // Band below the grid: last tile / tally bottom vs section bottom.
    const band = await page.evaluate(() => {
      const s = document.getElementById('skills').getBoundingClientRect();
      const lis = [...document.querySelectorAll('#skills li.skill-tile')];
      const gridBottom = Math.max(...lis.map((l) => l.getBoundingClientRect().bottom));
      const tally = [...document.querySelectorAll('#skills *')].filter((e) => /QUALITY/.test(e.textContent) && e.children.length === 0).map((e) => e.getBoundingClientRect().bottom);
      const lastContent = Math.max(gridBottom, ...tally.filter((b) => b > 0));
      return { sectionH: Math.round(s.height), gridBottomFromTop: Math.round(gridBottom - s.top), lastContentFromTop: Math.round(lastContent - s.top), emptyBelow: Math.round(s.bottom - lastContent) };
    });
    measure.skills[width] = { touch, before, after, band };
    await ctx.close();
  }
}

// ── 3. Page bottom at each width ───────────────────────────────────────
if (want('bottom')) {
  measure.bottom = {};
  for (const width of [375, 768, 1024, 1280, 1366, 1440, 1920]) {
    const { ctx, page, height } = await open(width);
    await prescroll(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, `bottom-${width}.png`) });
    await page.addScriptTag({ content: CONTENT_FN });
    const m = await page.evaluate(() => {
      const c = document.getElementById('contact');
      const cr = c.getBoundingClientRect();
      const items = window.__content(c).filter((e) => !e.ariaHidden);
      const lastContent = Math.max(...items.map((e) => e.y + e.h));
      const f = document.querySelector('body > div > div > footer, footer:last-of-type');
      const footers = [...document.querySelectorAll('footer')];
      const foot = footers[footers.length - 1].getBoundingClientRect();
      const footText = footers[footers.length - 1].innerText;
      const fcs = getComputedStyle(footers[footers.length - 1].querySelector('*') || footers[footers.length - 1]);
      return {
        viewportH: innerHeight,
        contactContentBottom: Math.round(lastContent),
        contactBottom: Math.round(cr.bottom),
        emptyInContactBelowContent: Math.round(cr.bottom - lastContent),
        footerTop: Math.round(foot.top), footerH: Math.round(foot.height), footerText: footText,
        footerFont: fcs.fontSize + ' ' + fcs.fontFamily.split(',')[0] + ' ' + fcs.color,
        emptyFromContentToPageEnd: Math.round(foot.bottom - lastContent),
        emptyFractionOfLastScreen: +((foot.bottom - lastContent) / innerHeight).toFixed(2),
      };
    });
    measure.bottom[width] = m;
    await ctx.close();
  }
}

// ── 4. Nav rail overlap ────────────────────────────────────────────────
if (want('navrail')) {
  measure.navrail = {};
  for (const width of [1024, 1280, 1366, 1440, 1920]) {
    const { ctx, page } = await open(width, { touch: false });
    await prescroll(page);
    await page.addScriptTag({ content: CONTENT_FN });
    measure.navrail[width] = {};
    const states = [
      ['hero', 'hero', 0],
      ['exp-datum', 'experience', 0],
      ['projects', 'projects', 0],
      ['projects-mid', 'projects', 250],
      ['skills', 'skills', 0],
      ['skills-mid', 'skills', 250],
      ['contact', 'contact', 0],
    ];
    for (const [label, id, off] of states) {
      await scrollToId(page, id, off);
      await sleep(1300);
      const hits = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Section navigation"]').getBoundingClientRect();
        const items = window.__content(document.querySelector('main'), { exclude: 'nav' });
        return {
          nav: { x: Math.round(nav.left), y: Math.round(nav.top), w: Math.round(nav.width), h: Math.round(nav.height) },
          overlaps: items
            .filter((e) => e.y < innerHeight && e.y + e.h > 0)
            .map((e) => ({ ...e, ox: Math.min(e.x + e.w, nav.right) - Math.max(e.x, nav.left), oy: Math.min(e.y + e.h, nav.bottom) - Math.max(e.y, nav.top) }))
            .filter((e) => e.ox > 0 && e.oy > 0)
            .map((e) => ({ d: e.d, kind: e.kind, ariaHidden: e.ariaHidden, op: e.op, ox: Math.round(e.ox), oy: Math.round(e.oy) })),
        };
      });
      measure.navrail[width][label] = hits;
      await page.screenshot({ path: path.join(OUT, `navrail-${width}-${label}.png`) });
    }
    await ctx.close();
  }
}

// ── 5. Typography inventory ────────────────────────────────────────────
if (want('fonts')) {
  measure.fonts = {};
  for (const width of [375, 1440]) {
    const { ctx, page } = await open(width);
    await prescroll(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    const inv = await page.evaluate(() => {
      const rows = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('svg')) continue;
        const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
        if (!text) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const size = parseFloat(cs.fontSize);
        const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / size;
        const sec = el.closest('section, footer, nav')?.id || el.closest('section, footer, nav')?.tagName.toLowerCase() || 'other';
        rows.push({
          fam: cs.fontFamily.split(',')[0].replace(/["']/g, ''), size, weight: cs.fontWeight, ls: +ls.toFixed(3),
          upper: cs.textTransform === 'uppercase' || text === text.toUpperCase() && /[A-Z]/.test(text), color: cs.color, sec, text: text.slice(0, 40),
          lh: cs.lineHeight, w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName, stroke: cs.webkitTextStrokeWidth,
        });
      }
      // Measure: characters per line on paragraphs longer than 80 chars.
      const paras = [...document.querySelectorAll('p, li, div')].filter((el) => {
        const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
        return t.length > 80;
      }).map((el) => {
        const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
        const cs = getComputedStyle(el);
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
        const lines = Math.max(1, Math.round(el.getBoundingClientRect().height / lh));
        return { sec: el.closest('section')?.id, text: t.slice(0, 40), size: cs.fontSize, lineHeight: cs.lineHeight, width: Math.round(el.getBoundingClientRect().width), lines, cpl: Math.round(t.length / lines), fam: cs.fontFamily.split(',')[0] };
      });
      return { rows, paras };
    });
    // Aggregate.
    const byFam = {};
    const bySize = {};
    const tracked = [];
    for (const r of inv.rows) {
      byFam[r.fam] = (byFam[r.fam] ?? 0) + 1;
      const k = `${r.fam} ${r.size}px`;
      bySize[k] = (bySize[k] ?? 0) + 1;
      if (r.ls >= 0.14) tracked.push(r);
    }
    const small = inv.rows.filter((r) => r.size <= 10.5);
    measure.fonts[width] = {
      totalTextEls: inv.rows.length,
      byFamily: byFam,
      bySize: Object.fromEntries(Object.entries(bySize).sort((a, b) => b[1] - a[1])),
      distinctSizes: [...new Set(inv.rows.map((r) => r.size))].sort((a, b) => a - b),
      trackedCount: tracked.length,
      trackedShare: +(tracked.length / inv.rows.length).toFixed(2),
      smallCount: small.length,
      smallBySection: small.reduce((a, r) => ((a[r.sec] = (a[r.sec] ?? 0) + 1), a), {}),
      smallSamples: small.slice(0, 400).map((r) => `${r.sec} | ${r.fam} ${r.size}px ls${r.ls} ${r.color} | ${r.text}`),
      samplesLarge: inv.rows.filter((r) => r.size >= 17).map((r) => `${r.sec} | ${r.fam} ${r.weight} ${r.size}px ls${r.ls} | ${r.text}`),
      paras: inv.paras,
    };
    await ctx.close();
  }
}

// ── 6. The cat ─────────────────────────────────────────────────────────
if (want('cat')) {
  measure.cat = {};
  for (const width of [375, 768, 1024, 1440, 1920]) {
    measure.cat[width] = [];
    for (let run = 0; run < 6; run++) {
      const { ctx, page } = await open(width);
      await sleep(1500);
      await page.addScriptTag({ content: CONTENT_FN });
      const res = await page.evaluate(() => {
        const cat = document.getElementById('oneko-react');
        if (!cat) return null;
        const c = cat.getBoundingClientRect();
        const items = window.__content(document.getElementById('hero'));
        const hits = items
          .filter((e) => !e.ariaHidden && e.kind !== 'box')
          .map((e) => ({ d: e.d, ox: Math.min(e.x + e.w, c.right) - Math.max(e.x, c.left), oy: Math.min(e.y + e.h, c.bottom) - Math.max(e.y, c.top) }))
          .filter((e) => e.ox > 4 && e.oy > 4)
          .map((e) => ({ d: e.d, ox: Math.round(e.ox), oy: Math.round(e.oy) }));
        return { x: Math.round(c.left), y: Math.round(c.top), w: Math.round(c.width), visible: getComputedStyle(cat).display !== 'none' && getComputedStyle(cat).opacity !== '0', hits };
      });
      if (res) {
        const clip = { x: Math.max(0, res.x - 90), y: Math.max(0, res.y - 70), width: Math.min(260, width - Math.max(0, res.x - 90)), height: 200 };
        if (run < 3 || res.hits.length) await page.screenshot({ path: path.join(OUT, `cat-${width}-run${run + 1}.png`), clip });
      }
      // After one click: where does it go?
      if (run === 0 && res) {
        const hops = [];
        for (let k = 0; k < 3; k++) {
          const p = await page.evaluate(() => {
            const r = document.getElementById('oneko-react').getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          });
          await page.mouse.click(p.x, p.y);
          await sleep(4500);
          const after = await page.evaluate(() => {
            const cat = document.getElementById('oneko-react');
            const c = cat.getBoundingClientRect();
            const items = window.__content(document.getElementById('hero'));
            return {
              x: Math.round(c.left), y: Math.round(c.top),
              hits: items.filter((e) => !e.ariaHidden && e.kind !== 'box').map((e) => ({ d: e.d, ox: Math.min(e.x + e.w, c.right) - Math.max(e.x, c.left), oy: Math.min(e.y + e.h, c.bottom) - Math.max(e.y, c.top) })).filter((e) => e.ox > 4 && e.oy > 4).map((e) => e.d),
            };
          });
          hops.push(after);
        }
        res.hopsAfterClicks = hops;
        await page.screenshot({ path: path.join(OUT, `cat-${width}-after-clicks.png`) });
      }
      // Does it stay in the hero once you scroll?
      if (run === 0) {
        await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6));
        await sleep(900);
        const scrolled = await page.evaluate(() => {
          const cat = document.getElementById('oneko-react');
          const cs = getComputedStyle(cat);
          const r = cat.getBoundingClientRect();
          return { display: cs.display, opacity: cs.opacity, y: Math.round(r.top) };
        });
        if (res) res.afterScroll60 = scrolled;
      }
      measure.cat[width].push(res);
      await ctx.close();
    }
  }
}

// ── 7. Dead vertical bands per section ─────────────────────────────────
if (want('bands')) {
  measure.bands = {};
  for (const width of [375, 768, 1024, 1440, 1920]) {
    const { ctx, page, height } = await open(width);
    await prescroll(page);
    await page.addScriptTag({ content: CONTENT_FN });
    measure.bands[width] = {};
    for (const id of ['hero', 'experience', 'projects', 'skills', 'contact']) {
      await scrollToId(page, id);
      await sleep(1300);
      const res = await page.evaluate(
        ([sid, vh]) => {
          const s = document.getElementById(sid);
          const sr = s.getBoundingClientRect();
          // Experience is a pinned stage: measure its first screen, not its
          // 4-screen scroll track.
          const top = sr.top;
          const bottom = sid === 'experience' ? vh : sr.bottom;
          const items = window.__content(s, { exclude: 'nav' }).filter((e) => !e.ariaHidden && e.kind !== 'box');
          const rows = new Uint8Array(Math.ceil(bottom - top));
          for (const e of items) {
            const a = Math.max(0, Math.floor(e.y - top));
            const b = Math.min(rows.length, Math.ceil(e.y + e.h - top));
            for (let y = a; y < b; y++) rows[y] = 1;
          }
          const gaps = [];
          let start = -1;
          for (let y = 0; y <= rows.length; y++) {
            if (y < rows.length && !rows[y]) {
              if (start < 0) start = y;
            } else if (start >= 0) {
              if (y - start >= 64) gaps.push({ from: start, to: y, px: y - start });
              start = -1;
            }
          }
          return { sectionH: Math.round(bottom - top), gaps, emptyTotal: gaps.reduce((a, g) => a + g.px, 0) };
        },
        [id, height],
      );
      measure.bands[width][id] = res;
    }
    await ctx.close();
  }
}

// ── 8. Hover states (pointer) ──────────────────────────────────────────
if (want('hover')) {
  const { ctx, page } = await open(1440);
  await prescroll(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(800);
  await page.locator('#hero a', { hasText: 'SEE MY WORK' }).hover();
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, 'hover-1440-hero-cta.png'), clip: { x: 100, y: 540, width: 600, height: 160 } });
  await scrollToId(page, 'projects');
  await sleep(900);
  await page.locator('#projects button[type="button"]').nth(2).hover();
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, 'hover-1440-project-tab.png') });
  await scrollToId(page, 'contact');
  await sleep(900);
  await page.locator('#contact a', { hasText: 'GitHub' }).first().hover();
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, 'hover-1440-contact-card.png') });
  await ctx.close();
}

await browser.close();
await fs.writeFile(measurePath, JSON.stringify(measure, null, 2));
console.log('wrote', measurePath);
