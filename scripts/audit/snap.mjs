// Starts the Vite dev server in-process, takes the requested screenshots with
// Playwright, then shuts everything down, so nothing is left running (the
// machine this was built on is short of memory).
//
//   node scripts/audit/snap.mjs <spec.json>
//
// spec: { "out": "dir", "shots": [{ "name", "width", "height", "path"?,
//   "reduced"?, "full"?, "scroll"?: "js expression run before the shot",
//   "wait"?: ms, "click"?: { "role", "name" } }] }
import { createServer } from 'vite';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const spec = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
await fs.mkdir(spec.out, { recursive: true });

const server = await createServer({ server: { port: 5198, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const errors = [];

try {
  for (const shot of spec.shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      reducedMotion: shot.reduced ? 'reduce' : 'no-preference',
    });
    page.on('pageerror', (e) => errors.push(`${shot.name}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${shot.name}: ${m.text()}`));
    await page.goto(base + (shot.path ?? ''), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    if (shot.scroll) {
      await page.evaluate(shot.scroll);
      await page.waitForTimeout(250);
    }
    if (shot.click) {
      await page.getByRole(shot.click.role, { name: shot.click.name, exact: shot.click.exact ?? false }).first().click();
    }
    await page.waitForTimeout(shot.wait ?? 700);
    await page.screenshot({ path: path.join(spec.out, `${shot.name}.png`), fullPage: Boolean(shot.full) });
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(errors.length ? errors.join('\n') : 'no console errors');
