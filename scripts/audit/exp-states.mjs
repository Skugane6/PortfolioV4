// Captures the Experience survey at points of its pinned travel.
//   node scripts/audit/exp-states.mjs <url> <outDir> <width> <height> [--reduced] [--steps=-0.3,0,0.25,0.5,0.75,1]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , url, outDir, w = '1440', h = '900', ...rest] = process.argv;
const reduced = rest.includes('--reduced');
const steps = (rest.find((a) => a.startsWith('--steps='))?.split('=')[1] ?? '-0.5,0,0.25,0.5,0.75,1').split(',').map(Number);
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

for (const p of steps) {
  const y = await page.evaluate((prog) => {
    const el = document.getElementById('experience');
    const track = el.querySelector('[style*="vh"]') ?? el;
    const top = track.getBoundingClientRect().top + scrollY;
    const range = Math.max(0, track.offsetHeight - innerHeight);
    return Math.round(prog < 0 ? top + prog * innerHeight : top + prog * range);
  }, p);
  await page.evaluate((yy) => window.scrollTo(0, yy - 30), y);
  await page.waitForTimeout(60);
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(500);
  const name = `exp-${w}-${String(Math.round(p * 100)).replace('-', 'm')}.png`;
  await page.screenshot({ path: path.join(outDir, name) });
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
