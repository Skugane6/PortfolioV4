// Lists elements inside a selector whose box starts within an x-range, for
// tracking down stray drawing artefacts.
//   node scripts/audit/probe-spans.mjs <url> <selector> <xMin> <xMax> [scrollExpr]
import { chromium } from 'playwright';

const [, , url, selector, xMin, xMax, scrollExpr] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
if (scrollExpr) await page.evaluate(scrollExpr);
await page.waitForTimeout(700);
const rows = await page.evaluate(
  ([sel, lo, hi]) =>
    [...document.querySelectorAll(sel)]
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.left >= lo && r.left <= hi && r.height > 20)
      .map(({ e, r }) => `${e.tagName} ${String(e.className?.baseVal ?? e.className).slice(0, 70)} | ${e.getAttribute('style')} | ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`),
  [selector, Number(xMin), Number(xMax)],
);
console.log(rows.join('\n') || 'none');
await browser.close();
