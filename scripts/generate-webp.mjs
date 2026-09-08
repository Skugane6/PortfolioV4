// Generates the .webp companion for every raster screenshot the site ships, so
// <picture> can serve webp with the .png as the fallback. Re-run after
// replacing any source png:  node scripts/generate-webp.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const sources = ['crafttraq.png', 'crafttraq-board.png', 'crafttraq-calendar.png'];

for (const file of sources) {
  const input = path.join(publicDir, file);
  const output = path.join(publicDir, file.replace(/\.png$/, '.webp'));
  await sharp(input).webp({ quality: 82 }).toFile(output);
  console.log(`Wrote ${output}`);
}
