// Audit helper: lists every file in public/ and src/assets/ with its size,
// pixel dimensions (raster images, via sharp) and the source files that
// reference it by name. Read-only; prints a Markdown table to stdout.
//
//   node scripts/audit/content-assets.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assetDirs = ['public', 'src/assets'];
// Where a reference could live: app source, the HTML shell, and build scripts.
const searchRoots = ['src', 'index.html', 'scripts'];

function walk(p) {
  const s = statSync(p);
  if (s.isFile()) return [p];
  return readdirSync(p).flatMap((name) => walk(join(p, name)));
}

const searchFiles = searchRoots
  .flatMap((r) => walk(join(root, r)))
  .filter((f) => /\.(tsx?|mjs|js|css|html|json|md)$/.test(f))
  .filter((f) => !f.includes(`${join('scripts', 'audit')}`));
const corpus = searchFiles.map((f) => ({ f: relative(root, f).replaceAll('\\', '/'), text: readFileSync(f, 'utf8') }));

const rows = [];
for (const dir of assetDirs) {
  for (const file of walk(join(root, dir))) {
    const rel = relative(root, file).replaceAll('\\', '/');
    const name = basename(file);
    const bytes = statSync(file).size;
    let dims = '';
    if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) {
      try {
        const m = await sharp(file).metadata();
        dims = `${m.width}x${m.height}${m.hasAlpha ? ' alpha' : ''} ${m.format}`;
      } catch (e) {
        dims = `? (${e.message.split('\n')[0]})`;
      }
    }
    // Match the bare file name; for src/assets also match the import stem.
    const refs = corpus
      .filter(({ text }) => text.includes(name))
      .map(({ f, text }) => {
        const lines = text.split('\n');
        const hits = lines.flatMap((l, i) => (l.includes(name) ? [i + 1] : []));
        return `${f}:${hits.join(',')}`;
      });
    rows.push({ rel, bytes, dims, ext: extname(name), refs });
  }
}

console.log('| File | Bytes | Pixels / format | Referenced from |');
console.log('| --- | ---: | --- | --- |');
for (const r of rows) {
  console.log(`| \`${r.rel}\` | ${r.bytes.toLocaleString('en-US')} | ${r.dims || '—'} | ${r.refs.length ? r.refs.join('<br>') : '**none**'} |`);
}
