// Compares the cover's layout with web fonts blocked (the fallback faces) and
// allowed, at several widths. Any height difference is layout shift waiting
// to happen when the fonts swap in.
//
//   npm run build && node scripts/audit/font-shift.mjs
import { preview } from 'vite';
import { chromium } from 'playwright';

const WIDTHS = [360, 375, 390, 412, 768, 1024, 1280, 1440, 1920];
const TARGETS = ['#cover-title', '#cover p', '#cover figure', '#cover ul', '#cover dl', '#cover'];

const server = await preview({ preview: { port: 5187, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch();

async function measure(width, blockFonts) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  if (blockFonts) await page.route('**/*.woff2', (r) => r.abort());
  // No JS: this is the prerendered first paint, before anything hydrates.
  await page.route('**/assets/*.js', (r) => r.abort());
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const out = await page.evaluate(
    (sels) => sels.map((s) => Math.round(document.querySelector(s)?.getBoundingClientRect().height ?? -1)),
    TARGETS,
  );
  await page.close();
  return out;
}

let worst = 0;
try {
  for (const w of WIDTHS) {
    const fallback = await measure(w, true);
    const web = await measure(w, false);
    const diffs = web.map((h, i) => h - fallback[i]);
    worst = Math.max(worst, ...diffs.map(Math.abs));
    console.log(String(w).padStart(5), TARGETS.map((t, i) => `${t.replace('#cover ', '')}:${diffs[i] >= 0 ? '+' : ''}${diffs[i]}`).join('  '));
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
console.log('worst height difference', worst, 'px');
