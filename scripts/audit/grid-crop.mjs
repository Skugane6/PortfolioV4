// Crops a region of an image, upscales it, and overlays a labelled coordinate
// grid in the SOURCE image's pixel space, for tracing geometry by eye.
//   node scripts/audit/grid-crop.mjs <src> <out> <left> <top> <width> <height> [scale=2] [step=20]
import sharp from 'sharp';

const [, , src, out, l, t, w, h, s = '2', st = '20'] = process.argv;
const [left, top, width, height, scale, step] = [l, t, w, h, s, st].map(Number);
const W = Math.round(width * scale);
const H = Math.round(height * scale);

const lines = [];
for (let x = Math.ceil(left / step) * step; x <= left + width; x += step) {
  const px = (x - left) * scale;
  const major = x % (step * 5) === 0;
  lines.push(`<line x1="${px}" y1="0" x2="${px}" y2="${H}" stroke="${major ? '#ff3b3b' : '#ffe14d'}" stroke-opacity="${major ? 0.75 : 0.35}" stroke-width="1"/>`);
  if (major) lines.push(`<text x="${px + 2}" y="12" fill="#ff3b3b" font-size="11" font-family="monospace">${x}</text>`);
}
for (let y = Math.ceil(top / step) * step; y <= top + height; y += step) {
  const py = (y - top) * scale;
  const major = y % (step * 5) === 0;
  lines.push(`<line x1="0" y1="${py}" x2="${W}" y2="${py}" stroke="${major ? '#ff3b3b' : '#ffe14d'}" stroke-opacity="${major ? 0.75 : 0.35}" stroke-width="1"/>`);
  if (major) lines.push(`<text x="2" y="${py - 2}" fill="#ff3b3b" font-size="11" font-family="monospace">${y}</text>`);
}
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${lines.join('')}</svg>`);

await sharp(src)
  .extract({ left, top, width, height })
  .resize(W, H)
  .flatten({ background: '#000' })
  .composite([{ input: overlay }])
  .toFile(out);
console.log('wrote', out, `${W}x${H}`);
