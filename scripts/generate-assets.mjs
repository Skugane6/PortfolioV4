// Generates the share and icon assets in public/ from the site's own parts:
//   og.png                 1200×630 link preview (rendered from ?fixture=og)
//   favicon.svg            the detail-bubble mark, vector
//   favicon.ico            16 + 32 px, PNG-in-ICO
//   apple-touch-icon.png   180 px
//   icon-192.png, icon-512.png, icon-maskable-512.png   for the web manifest
//
//   node scripts/generate-assets.mjs
import { createServer } from 'vite';
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const pub = (f) => path.join(root, 'public', f);

// ── Icon: public/favicon.svg is drawn by scripts/build-icon.py from Archivo's
// glyph outlines (run it first). The rasters here are made from it; the
// maskable one scales the mark into the 80% safe zone.
const markSvg = await fs.readFile(pub('favicon.svg'), 'utf8');
function iconSvg({ pad = 0 } = {}) {
  if (!pad) return markSvg;
  const k = (512 - pad * 2) / 512;
  return markSvg
    .replace('<rect width="512" height="512" fill="#0f2a4c"/>', '<rect width="512" height="512" fill="#0f2a4c"/><g transform="translate(' + pad + ' ' + pad + ') scale(' + k + ')">')
    .replace('</svg>', '</g></svg>');
}

function ico(pngs) {
  // ICONDIR + ICONDIRENTRY[n] + PNG data (PNG-compressed entries, Vista+).
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const o = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, o);
    header.writeUInt8(size >= 256 ? 0 : size, o + 1);
    header.writeUInt8(0, o + 2);
    header.writeUInt8(0, o + 3);
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(data.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const raster = (size, opts) => sharp(Buffer.from(iconSvg(opts))).resize(size, size).png().toBuffer();
await fs.writeFile(pub('favicon.ico'), ico([{ size: 16, data: await raster(16) }, { size: 32, data: await raster(32) }]));
await fs.writeFile(pub('apple-touch-icon.png'), await raster(180));
await fs.writeFile(pub('icon-192.png'), await raster(192));
await fs.writeFile(pub('icon-512.png'), await raster(512));
// Maskable: the mark inside the 80% safe zone.
await fs.writeFile(pub('icon-maskable-512.png'), await raster(512, { pad: 52 }));

// ── OG image, rendered from the site's own components.
const server = await createServer({ root, server: { port: 5197, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${server.resolvedUrls.local[0]}?fixture=og`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: pub('og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
} finally {
  await browser.close();
  await server.close();
}
for (const f of ['og.png', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) {
  console.log(f.padEnd(24), (await fs.stat(pub(f))).size, 'bytes');
}
