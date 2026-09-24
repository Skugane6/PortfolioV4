// Visual audit probe: quick DOM facts (cat element, section rects, fonts in use).
import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5199/';
const browser = await chromium.launch();
for (const [w, h] of [[375, 812], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  const out = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('section, footer')].map((s) => {
      const r = s.getBoundingClientRect();
      return { tag: s.tagName, id: s.id, top: Math.round(r.top + scrollY), h: Math.round(r.height) };
    });
    const catCandidates = [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.position === 'fixed' && !el.closest('nav') && el.getBoundingClientRect().width < 120 && el.getBoundingClientRect().width > 10;
    }).map((el) => ({ tag: el.tagName, cls: el.className?.toString().slice(0, 80), id: el.id, rect: el.getBoundingClientRect().toJSON(), z: getComputedStyle(el).zIndex, bg: getComputedStyle(el).backgroundImage.slice(0, 40) }));
    const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`);
    return { sections, docH: document.documentElement.scrollHeight, catCandidates, loaded: [...new Set(loaded)] };
  });
  console.log(w, JSON.stringify(out, null, 1));
  await ctx.close();
}
await browser.close();
