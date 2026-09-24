// Visual audit: motion. Captures short frame sequences (~100ms apart) of the
// hero load, a section reveal, a project tab switch and the Experience card
// handover, tiles each sequence into a labelled contact sheet, and inventories
// every infinitely-looping CSS animation per section.
//
//   node scripts/audit/visual-motion.mjs [baseUrl] [--only=hero,reveal,tabs,exp,loops]
//
// Output: docs/overhaul/screenshots/before/visual/motion/<seq>/NN.png,
//         docs/overhaul/screenshots/before/visual/motion-<seq>-sheet.png,
//         docs/overhaul/screenshots/before/visual/visual-motion.json
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const baseUrl = args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:5199/';
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1].split(',') : null;
const want = (k) => !only || only.includes(k);

const OUT = 'docs/overhaul/screenshots/before/visual';
const MOTION = path.join(OUT, 'motion');
await fs.mkdir(MOTION, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = {};
const browser = await chromium.launch();

async function ctxFor(width, height, mobile = width < 768) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  return ctx;
}

// Grab frames every `every` ms for `total` ms. Returns [{file, t}].
async function frames(page, name, { every = 100, total = 1500, clip } = {}) {
  const dir = path.join(MOTION, name);
  await fs.mkdir(dir, { recursive: true });
  const t0 = Date.now();
  const out = [];
  let i = 0;
  while (Date.now() - t0 < total) {
    const target = t0 + i * every;
    const wait = target - Date.now();
    if (wait > 0) await sleep(wait);
    const t = Date.now() - t0;
    const file = path.join(dir, `${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: file, clip });
    out.push({ file, t });
    i++;
  }
  return out;
}

// Tile frames into one sheet, each labelled with its timestamp.
async function sheet(name, list, { cols = 5, cellW = 360 } = {}) {
  const meta = await sharp(list[0].file).metadata();
  const cellH = Math.round((meta.height / meta.width) * cellW);
  const labelH = 22;
  const rows = Math.ceil(list.length / cols);
  const composites = [];
  for (const [k, f] of list.entries()) {
    const x = (k % cols) * cellW;
    const y = Math.floor(k / cols) * (cellH + labelH);
    const buf = await sharp(f.file).resize(cellW, cellH).toBuffer();
    composites.push({ input: buf, left: x, top: y + labelH });
    const svg = `<svg width="${cellW}" height="${labelH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000"/><text x="6" y="16" font-family="monospace" font-size="14" fill="#ffd166">#${k} t=${f.t}ms</text></svg>`;
    composites.push({ input: Buffer.from(svg), left: x, top: y });
  }
  const file = path.join(OUT, `motion-${name}-sheet.png`);
  await sharp({ create: { width: cols * cellW, height: rows * (cellH + labelH), channels: 3, background: '#222' } })
    .composite(composites)
    .png()
    .toFile(file);
  return file;
}

// ── Hero load ──────────────────────────────────────────────────────────
if (want('hero')) {
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    const ctx = await ctxFor(w, h);
    const page = await ctx.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const list = await frames(page, `hero-load-${w}`, { every: 100, total: 2000 });
    report[`hero-load-${w}`] = { frames: list.length, sheet: await sheet(`hero-load-${w}`, list, { cols: 5, cellW: w > 800 ? 360 : 180 }) };
    await ctx.close();
  }
}

// ── Section reveal (Projects heading + panel entering) ─────────────────
if (want('reveal')) {
  const ctx = await ctxFor(1440, 900);
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await sleep(1200);
  // Land with the Projects top 150px into the viewport, never having seen it.
  await page.evaluate(() => {
    const el = document.getElementById('projects');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150);
  });
  const list = await frames(page, 'reveal-projects-1440', { every: 100, total: 1600 });
  report['reveal-projects-1440'] = { frames: list.length, sheet: await sheet('reveal-projects-1440', list) };
  await ctx.close();
}

// ── Project tab switch ─────────────────────────────────────────────────
if (want('tabs')) {
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    const ctx = await ctxFor(w, h);
    const page = await ctx.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    });
    await page.evaluate(() => {
      const el = document.getElementById('projects');
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + (innerWidth < 768 ? 60 : 180));
    });
    await sleep(1500);
    const tab = page.locator('#projects button[type="button"]').nth(1);
    if (w < 768) await tab.tap({ noWaitAfter: true });
    else await tab.click({ noWaitAfter: true });
    const list = await frames(page, `tab-switch-${w}`, { every: 90, total: 1400 });
    report[`tab-switch-${w}`] = { frames: list.length, sheet: await sheet(`tab-switch-${w}`, list, { cols: 5, cellW: w > 800 ? 360 : 180 }) };
    // How far below the tabs does the new project's name land?
    report[`tab-switch-${w}`].nameOffset = await page.evaluate(() => {
      const h = [...document.querySelectorAll('#projects h3, #projects [class*="font-display"]')].find((e) => e.getBoundingClientRect().height > 0);
      const tabs = document.querySelector('#projects button[type="button"]').getBoundingClientRect();
      return h ? { nameTopInViewport: Math.round(h.getBoundingClientRect().top), tabsTop: Math.round(tabs.top), vh: innerHeight } : null;
    });
    await ctx.close();
  }
}

// ── Experience handover: card N -> N+1 with a real wheel/scroll gesture ─
if (want('exp')) {
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    const ctx = await ctxFor(w, h);
    const page = await ctx.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await sleep(1000);
    // Park at the section top, then take one reader-sized scroll (~ a third
    // of a screen) in small increments, then let the section's snap act.
    await page.evaluate(() => {
      const el = document.getElementById('experience');
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    });
    await sleep(1500);
    const startY = await page.evaluate(() => window.scrollY);
    const gesture = page.evaluate(async (dy) => {
      for (let k = 0; k < 10; k++) { window.scrollBy(0, dy / 10); await new Promise((r) => setTimeout(r, 30)); }
    }, Math.round(h * 0.35));
    const list = await frames(page, `exp-first-scroll-${w}`, { every: 120, total: 2600 });
    await gesture;
    const endY = await page.evaluate(() => window.scrollY);
    report[`exp-first-scroll-${w}`] = { startY, endY, travelledByUser: Math.round(h * 0.35), snapAdded: endY - startY - Math.round(h * 0.35), frames: list.length, sheet: await sheet(`exp-first-scroll-${w}`, list, { cols: 6, cellW: w > 800 ? 300 : 150 }) };

    // Second gesture: from the first settled card to the next.
    const startY2 = endY;
    const gesture2 = page.evaluate(async (dy) => {
      for (let k = 0; k < 10; k++) { window.scrollBy(0, dy / 10); await new Promise((r) => setTimeout(r, 30)); }
    }, Math.round(h * 0.35));
    const list2 = await frames(page, `exp-handover-${w}`, { every: 120, total: 2600 });
    await gesture2;
    const endY2 = await page.evaluate(() => window.scrollY);
    report[`exp-handover-${w}`] = { startY: startY2, endY: endY2, snapAdded: endY2 - startY2 - Math.round(h * 0.35), frames: list2.length, sheet: await sheet(`exp-handover-${w}`, list2, { cols: 6, cellW: w > 800 ? 300 : 150 }) };
    await ctx.close();
  }
}

// ── Infinite loops per section ─────────────────────────────────────────
if (want('loops')) {
  const ctx = await ctxFor(1440, 900);
  const page = await ctx.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  });
  await sleep(800);
  report.loops = {};
  for (const id of ['hero', 'experience', 'projects', 'skills', 'contact']) {
    await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    }, id);
    await sleep(900);
    report.loops[id] = await page.evaluate((sid) => {
      const sec = document.getElementById(sid);
      const rows = {};
      for (const a of document.getAnimations()) {
        const t = a.effect?.getTiming?.();
        const target = a.effect?.target;
        if (!t || !target || t.iterations !== Infinity) continue;
        if (!sec.contains(target)) continue;
        const name = a.animationName || a.id || 'waapi';
        const dur = typeof t.duration === 'number' ? t.duration : 0;
        const k = `${name} ${Math.round(dur)}ms`;
        rows[k] = (rows[k] ?? 0) + 1;
      }
      // JS-driven loops (requestAnimationFrame) do not show up here; note the
      // canvas as a probable one.
      return { cssInfinite: rows, total: Object.values(rows).reduce((a, b) => a + b, 0), canvases: sec.querySelectorAll('canvas').length };
    }, id);
  }
  // Also: the fixed nav + any page-level loops (the "scroll to survey" pulse etc.).
  report.loops.page = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming?.().iterations === Infinity).length);
  await ctx.close();
}

await browser.close();
const file = path.join(OUT, 'visual-motion.json');
let prev = {};
try { prev = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
await fs.writeFile(file, JSON.stringify({ ...prev, ...report }, null, 2));
console.log(JSON.stringify(report, null, 1));
