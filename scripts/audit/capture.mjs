// Baseline / after screenshot capture for the overhaul audit.
//
//   node scripts/audit/capture.mjs <baseUrl> <outDir> [--widths=375,768] [--reduced] [--label=before]
//
// For every width: first-screen hero, one viewport shot per section, Experience
// at 0/25/50/75/100% of its pinned travel (raw ~120ms after the scroll lands,
// and settled after the section's own scroll-snap has had time to act), then a
// full-page shot after a slow pre-scroll so whileInView entrances have fired.
// Console errors, failed requests and >=400 responses go to <outDir>/log.json.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , baseUrl = 'http://127.0.0.1:5199/', outDir = 'docs/overhaul/screenshots/before', ...rest] = process.argv;
const flag = (name, fallback) => {
  const hit = rest.find((a) => a.startsWith(`--${name}`));
  if (!hit) return fallback;
  const [, value] = hit.split('=');
  return value ?? true;
};

const HEIGHTS = { 375: 812, 390: 844, 768: 1024, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 };
const widths = String(flag('widths', '375,768,1024,1440,1920')).split(',').map(Number);
const reduced = Boolean(flag('reduced', false));
const sections = String(flag('sections', 'experience,projects,skills,contact')).split(',');
const expSteps = [0, 0.25, 0.5, 0.75, 1];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const log = { baseUrl, reduced, runs: [] };
const browser = await chromium.launch();

for (const width of widths) {
  const height = HEIGHTS[width] ?? 900;
  const mobile = width < 768;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const run = { width, height, console: [], failed: [], badStatus: [], experience: [] };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') run.console.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => run.console.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => run.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (r.status() >= 400) run.badStatus.push(`${r.status()} ${r.url()}`);
  });

  const dir = path.join(outDir, String(width));
  await fs.mkdir(dir, { recursive: true });
  const shot = (name, opts = {}) => page.screenshot({ path: path.join(dir, `${name}.png`), ...opts });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(1800);
  await shot('00-hero');

  for (const [i, id] of sections.entries()) {
    const top = await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    }, id);
    if (top === null) continue;
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await sleep(1400);
    await shot(`${String(i + 1).padStart(2, '0')}-${id}`);
  }

  // Experience survey states.
  for (const p of expSteps) {
    const target = await page.evaluate((prog) => {
      const el = document.getElementById('experience');
      if (!el) return null;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const pinned = el.offsetHeight - window.innerHeight;
      return Math.round(top + pinned * prog);
    }, p);
    if (target === null) break;
    // Approach from a little above so the section's direction-aware snap sees
    // a downward scroll, the way a reader arrives.
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 40)), target);
    await sleep(80);
    await page.evaluate((y) => window.scrollTo(0, y), target);
    await sleep(120);
    const pct = String(Math.round(p * 100)).padStart(3, '0');
    await shot(`exp-${pct}-raw`);
    const readoutSelector = String(flag('readout', '#experience span.w-9'));
    const rawReadout = await page.evaluate((sel) => document.querySelector(sel)?.textContent ?? null, readoutSelector);
    await sleep(1800);
    await shot(`exp-${pct}-settled`);
    const settled = await page.evaluate(
      (sel) => ({ y: Math.round(window.scrollY), readout: document.querySelector(sel)?.textContent ?? null }),
      readoutSelector,
    );
    run.experience.push({ progress: p, requestedY: target, rawReadout, settledY: settled.y, settledReadout: settled.readout });
  }

  // Slow pre-scroll so every once-only whileInView entrance has fired, then a
  // full-page capture from the top.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
  });
  await sleep(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1200);
  run.docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await shot('99-fullpage', { fullPage: true });

  log.runs.push(run);
  await context.close();
  console.log(`done ${width}: console=${run.console.length} failed=${run.failed.length} bad=${run.badStatus.length}`);
}

await browser.close();
await fs.writeFile(path.join(outDir, 'log.json'), JSON.stringify(log, null, 2));
console.log('wrote', path.join(outDir, 'log.json'));
