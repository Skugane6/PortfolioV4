// Every rendered text node on the page, with its drawn size and its contrast
// against the first opaque background behind it. Same headline numbers as the
// baseline audit (audit/a11y/contrast-summary.json) so the two compare.
//
//   node scripts/audit/with-preview.mjs node scripts/audit/text-scan.mjs {url} docs/overhaul/audit/a11y-after
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , url, outDir = 'docs/overhaul/audit/a11y-after'] = process.argv;
const WIDTHS = [375, 1440];
const browser = await chromium.launch();
const summary = {};

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: width < 800 ? 812 : 900 }, isMobile: width < 800 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
  });
  summary[width] = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const blend = (top, under) => ({
      r: top.r * top.a + under.r * (1 - top.a),
      g: top.g * top.a + under.g * (1 - top.a),
      b: top.b * top.a + under.b * (1 - top.a),
      a: 1,
    });
    const background = (el) => {
      const layers = [];
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 1) break;
        }
      }
      let bg = { r: 15, g: 42, b: 76, a: 1 }; // the page ground
      for (const l of layers.reverse()) bg = blend(l, bg);
      return bg;
    };
    const rows = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent?.trim();
      const el = n.parentElement;
      if (!text || !el || el.closest('dialog:not([open]), script, style, [hidden]')) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || r.width <= 1 || r.height <= 1 || Number(cs.opacity) === 0) continue;
      let size = parseFloat(cs.fontSize);
      const svg = el.closest('svg');
      if (svg?.viewBox?.baseVal?.width) size *= svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const fg = parse(svg ? cs.fill : cs.color) ?? parse(cs.color);
      const bg = background(el);
      const col = fg.a < 1 ? blend(fg, bg) : fg;
      const [hi, lo] = [lum(col), lum(bg)].sort((a, b) => b - a);
      const ratio = (hi + 0.05) / (lo + 0.05);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      rows.push({ text: text.slice(0, 40), size: Math.round(size * 10) / 10, ratio: Math.round(ratio * 100) / 100, fails: ratio < (large ? 3 : 4.5) });
    }
    return {
      textNodes: rows.length,
      under12: rows.filter((r) => r.size < 12).length,
      under13: rows.filter((r) => r.size < 12.95).length,
      fails: rows.filter((r) => r.fails).length,
      minRatio: Math.min(...rows.map((r) => r.ratio)),
      failures: rows.filter((r) => r.fails).slice(0, 20),
    };
  });
  await page.close();
}
await browser.close();
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'text-scan.json'), JSON.stringify(summary, null, 2));
for (const [w, s] of Object.entries(summary)) {
  console.log(w, `nodes ${s.textNodes}, under 12px ${s.under12}, under 13px ${s.under13}, contrast fails ${s.fails}, min ratio ${s.minRatio}`);
  for (const f of s.failures) console.log('   ', f);
}
