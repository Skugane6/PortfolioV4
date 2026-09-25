//   node scripts/audit/with-preview.mjs node scripts/audit/narrow-plot-probe.mjs {url}
// Does the phone survey's airframe plot in on arrival (production build)?
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const read = () =>
  page.evaluate(() => {
    const p = document.querySelector('#experience svg[data-airframe] path[stroke-dasharray], #experience svg[data-airframe] path[pathLength]');
    const any = document.querySelector('#experience svg[data-airframe] path');
    const el = p ?? any;
    return el ? { dash: el.getAttribute('stroke-dasharray'), offset: el.getAttribute('stroke-dashoffset'), style: el.getAttribute('style') } : null;
  });
console.log('before scroll', JSON.stringify(await read()));
for (const t of [1500, 3000]) {
  await page.waitForTimeout(t);
  console.log(`+${t}ms idle  `, JSON.stringify(await read()), await page.evaluate(() => document.getElementById('experience').getBoundingClientRect().top));
}
// Scroll in steps, the way a person arrives: the drawing must never show
// fully drawn and then blink out.
const target = await page.evaluate(() => document.getElementById('experience').getBoundingClientRect().top + scrollY);
for (let y = 0; y < target; y += 200) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await page.waitForTimeout(40);
  const top = await page.evaluate(() => document.querySelector('#experience svg[data-airframe]').getBoundingClientRect().top);
  if (top < 812) console.log(`y=${y} drawing top=${Math.round(top)}`, JSON.stringify(await read()));
}
await page.evaluate((yy) => scrollTo(0, yy), target);
await page.waitForTimeout(150);
console.log('during plot  ', JSON.stringify(await read()));
await page.waitForTimeout(1500);
console.log('after plot   ', JSON.stringify(await read()));
await browser.close();
