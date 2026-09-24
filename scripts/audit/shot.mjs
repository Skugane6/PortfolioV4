// One-off screenshot helper: node scripts/audit/shot.mjs <url> <out.png> [width] [height] [--full] [--wait=ms]
import { chromium } from 'playwright';

const [, , url, out, width = '1440', height = '900', ...rest] = process.argv;
const full = rest.includes('--full');
const wait = Number(rest.find((a) => a.startsWith('--wait='))?.split('=')[1] ?? 1500);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(wait);
await page.screenshot({ path: out, fullPage: full });
await browser.close();
console.log('wrote', out);
