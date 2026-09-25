// Checks that a synthesized touch scroll moves the page on a phone viewport,
// from a few starting points.
//   node scripts/audit/with-preview.mjs node scripts/audit/touch-scroll-probe.mjs {url}
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);
for (const [x, y] of [
  [187, 447],
  [40, 150],
  [187, 700],
]) {
  await page.evaluate(() => scrollTo(0, 0));
  const target = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.outerHTML.slice(0, 80), [x, y]);
  await cdp.send('Input.synthesizeScrollGesture', { x, y, yDistance: -600, speed: 800, gestureSourceType: 'touch' });
  await page.waitForTimeout(400);
  console.log(`start ${x},${y} on ${target} -> scrollY ${await page.evaluate(() => scrollY)}`);
}
console.log(await page.evaluate(() => ({ htmlClass: document.documentElement.className, html: getComputedStyle(document.documentElement).overflow, body: getComputedStyle(document.body).overflow, touchHtml: getComputedStyle(document.documentElement).touchAction, touchBody: getComputedStyle(document.body).touchAction, scrollH: document.documentElement.scrollHeight, inner: innerHeight })));
await page.mouse.wheel(0, 500);
await page.waitForTimeout(400);
console.log('after wheel scrollY', await page.evaluate(() => scrollY));
const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
const p2 = await ctx2.newPage();
const c2 = await ctx2.newCDPSession(p2);
await p2.goto('https://example.com');
await c2.send('Input.synthesizeScrollGesture', { x: 187, y: 400, yDistance: -600, speed: 800, gestureSourceType: 'touch' });
await p2.setContent('<div style="height:5000px;background:linear-gradient(red,blue)">x</div>');
await c2.send('Input.synthesizeScrollGesture', { x: 187, y: 400, yDistance: -600, speed: 800, gestureSourceType: 'touch' });
await p2.waitForTimeout(400);
console.log('control page touch scrollY', await p2.evaluate(() => scrollY));
await browser.close();
