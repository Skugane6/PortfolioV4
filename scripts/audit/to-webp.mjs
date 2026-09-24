// Converts every PNG under a directory to WebP in place (the PNG is removed),
// and rewrites ".png" references inside JSON/MD files under the same tree.
//   node scripts/audit/to-webp.mjs docs/overhaul/screenshots
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2] ?? 'docs/overhaul/screenshots';

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let before = 0;
let after = 0;
let count = 0;
const textFiles = [];
for await (const file of walk(root)) {
  if (/\.(json|md)$/i.test(file)) textFiles.push(file);
  if (!/\.png$/i.test(file)) continue;
  const out = file.replace(/\.png$/i, '.webp');
  const { size } = await fs.stat(file);
  await sharp(file).webp({ quality: 80, effort: 5 }).toFile(out);
  before += size;
  after += (await fs.stat(out)).size;
  await fs.unlink(file);
  count++;
}
for (const file of textFiles) {
  const src = await fs.readFile(file, 'utf8');
  const next = src.replace(/(screenshots\/[^"'\s)]*?)\.png/g, '$1.webp');
  if (next !== src) await fs.writeFile(file, next);
}
console.log(`${count} files: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
