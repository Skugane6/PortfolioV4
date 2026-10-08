// Responsive WebP variants of the images the page shows, sized for where they
// are displayed. The originals are left untouched.
//
//   node scripts/generate-images.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const out = path.join(root, 'public', 'img');
await fs.mkdir(out, { recursive: true });

const jobs = [
  // Portrait in the cover title block: 40 CSS px, so 40/80/120 for 1-3x.
  { src: 'src/assets/hero.jpg', name: 'portrait', widths: [40, 80, 120], quality: 82 },
  // Western lockup in the proof references: about 30 CSS px tall (126 wide).
  { src: 'public/western-mark.png', name: 'western-mark', widths: [128, 256, 384], quality: 90 },
  // MHI RJ logo beside the company name: 32 CSS px tall (73 wide).
  { src: 'public/MHIRJ_Logo.png', name: 'mhirj', widths: [80, 160, 240], quality: 90 },
  // CraftTraq job board in the browser frame: up to ~660 CSS px on the page, 1000 in the detail sheet.
  { src: 'public/crafttraq-board.png', name: 'crafttraq-board', widths: [480, 800, 1200, 1600], quality: 80 },
  // CraftTraq calendar in the phone frame: up to ~190 CSS px.
  { src: 'public/crafttraq-calendar.png', name: 'crafttraq-calendar', widths: [190, 375], quality: 82 },
  // Genshillion start screen in the browser frame (same sizes as CraftTraq's board).
  { src: 'public/genshillion-desktop.png', name: 'genshillion-desktop', widths: [480, 800, 1200, 1600], quality: 80 },
  // Genshillion phone view in the phone frame.
  { src: 'public/genshillion-phone.png', name: 'genshillion-phone', widths: [190, 375], quality: 82 },
];

for (const job of jobs) {
  const input = path.join(root, job.src);
  for (const w of job.widths) {
    const file = path.join(out, `${job.name}-${w}.webp`);
    const info = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: job.quality, effort: 6 }).toFile(file);
    console.log(`${path.basename(file).padEnd(28)} ${info.width}x${info.height} ${info.size} bytes`);
  }
}
