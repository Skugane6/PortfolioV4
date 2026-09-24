// Visual audit: is the site footer's text ever painted? Scrolls to the very
// bottom at several widths and reads the footer text's effective opacity.
import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5199/';
const browser = await chromium.launch();
for (const [w, h] of [[375, 812], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const f = [...document.querySelectorAll('footer')].pop();
    const inner = f.firstElementChild;
    const nav = document.querySelector('nav[aria-label="Section navigation"]').getBoundingClientRect();
    const fr = inner.getBoundingClientRect();
    return { opacity: getComputedStyle(inner).opacity, transform: getComputedStyle(inner).transform, textTop: Math.round(fr.top), textBottom: Math.round(fr.bottom), vh: innerHeight, navTop: Math.round(nav.top), coveredByBottomBar: innerWidth < 1024 && fr.top >= nav.top - 1 };
  });
  console.log(w, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
