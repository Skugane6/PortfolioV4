// Frame timing on a phone viewport at 4x CPU, scrolling the whole page with
// wheel steps (synthesized touch gestures don't scroll in this headless
// Chromium build, even on a plain test page).
//   node scripts/audit/with-preview.mjs node scripts/audit/mobile-frames.mjs {url}
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => {
  window.__frames = [];
  window.__long = 0;
  let last = performance.now();
  const tick = (t) => {
    window.__frames.push(t - last);
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new PerformanceObserver((l) => (window.__long += l.getEntries().length)).observe({ type: 'longtask', buffered: false });
});
const height = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < height; y += 120) {
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(500);
const stats = await page.evaluate(() => {
  const f = window.__frames.slice(2).sort((a, b) => a - b);
  const q = (p) => f[Math.min(f.length - 1, Math.floor(p * f.length))];
  return {
    frames: f.length,
    p50: +q(0.5).toFixed(1),
    p95: +q(0.95).toFixed(1),
    max: +f[f.length - 1].toFixed(1),
    over16_7: +((f.filter((x) => x > 16.7).length / f.length) * 100).toFixed(1),
    over50: +((f.filter((x) => x > 50).length / f.length) * 100).toFixed(1),
    longTasks: window.__long,
    scrolledTo: Math.round(scrollY),
  };
});
console.log(JSON.stringify(stats));
await browser.close();
