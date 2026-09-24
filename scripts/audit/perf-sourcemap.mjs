// Sourcemap helpers for the performance audit.
//
//   node scripts/audit/perf-sourcemap.mjs breakdown <dir-with-js-and-maps>
//       Minified bytes per source bucket for every chunk (what actually ships),
//       with a gzip estimate per bucket. Writes docs/overhaul/audit/perf/bundle-minified-breakdown.json.
//   node scripts/audit/perf-sourcemap.mjs resolve <dir> <chunkPrefix>:<line>:<col> [...]
//       Maps positions in the minified chunk (1-based line, 0-based col, as
//       Lighthouse and Error.stack report them... stack columns are 1-based,
//       pass col-1) to original source.
//
// Build the maps with: npx vite build --outDir "$TEMP/pf-perf-dist-sm" --emptyOutDir --sourcemap
// (the minified code is byte-identical to the non-sourcemap build, so positions carry over).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SourceMapConsumer } from 'source-map-js';

const [, , cmd, dir, ...rest] = process.argv;
const assets = path.join(dir, 'assets');
const chunkFiles = fs.readdirSync(assets).filter((f) => f.endsWith('.js'));
const loadChunk = (prefix) => {
  const f = chunkFiles.find((c) => c.startsWith(prefix + '-')) ?? chunkFiles.find((c) => c.startsWith(prefix));
  const code = fs.readFileSync(path.join(assets, f), 'utf8');
  const map = new SourceMapConsumer(JSON.parse(fs.readFileSync(path.join(assets, f + '.map'), 'utf8')));
  return { f, code, map };
};

const bucketOf = (src) => {
  const p = (src ?? '').split(String.fromCharCode(92)).join('/');
  if (!src) return 'unmapped (rollup glue)';
  if (p.includes('node_modules/framer-motion/') || p.includes('node_modules/motion-dom/') || p.includes('node_modules/motion-utils/')) return 'framer-motion (+motion-dom/utils)';
  if (p.includes('node_modules/react-dom/')) return 'react-dom';
  if (p.includes('node_modules/react/') || p.includes('node_modules/scheduler/')) return 'react + scheduler';
  if (p.includes('node_modules/')) return 'other node_modules';
  if (p.includes('src/data/skillIcons')) return 'skillIcons.ts (SVG path data)';
  if (p.includes('src/oneko/') && p.endsWith('.json')) return 'oneko sprite sheets (base64 JSON)';
  if (p.includes('src/oneko/')) return 'oneko code';
  if (p.includes('src/data/')) return 'src/data (content + contact icons)';
  if (p.includes('src/components/experience/') || p.endsWith('Experience.tsx')) return 'app: Experience';
  if (p.includes('src/components/hero/') || p.endsWith('Hero.tsx')) return 'app: Hero';
  if (p.includes('src/components/projects/') || p.endsWith('Projects.tsx')) return 'app: Projects';
  if (p.includes('src/components/skills/') || p.endsWith('Skills.tsx')) return 'app: Skills';
  if (p.includes('src/')) return 'app: other (App, NavRail, Contact, Cursor, hooks, utils)';
  return 'other: ' + p;
};

if (cmd === 'breakdown') {
  const out = {};
  for (const f of chunkFiles) {
    const { code, map } = loadChunk(f.replace(/-[^-]+\.js$/, ''));
    const lines = code.split('\n');
    const segs = [];
    map.eachMapping((m) => segs.push(m), null, SourceMapConsumer.GENERATED_ORDER);
    const pieces = {}; // bucket -> array of strings
    const bySource = {};
    const add = (bucket, src, s) => {
      (pieces[bucket] ??= []).push(s);
      bySource[src ?? '(unmapped)'] = (bySource[src ?? '(unmapped)'] ?? 0) + Buffer.byteLength(s);
    };
    let i = 0;
    for (let ln = 1; ln <= lines.length; ln++) {
      const text = lines[ln - 1];
      const onLine = [];
      while (i < segs.length && segs[i].generatedLine === ln) onLine.push(segs[i++]);
      let cursor = 0;
      for (let k = 0; k < onLine.length; k++) {
        const m = onLine[k];
        if (m.generatedColumn > cursor) add('unmapped (rollup glue)', null, text.slice(cursor, m.generatedColumn));
        const endCol = k + 1 < onLine.length ? onLine[k + 1].generatedColumn : text.length;
        add(bucketOf(m.source), m.source, text.slice(m.generatedColumn, endCol));
        cursor = endCol;
      }
      if (cursor < text.length) add('unmapped (rollup glue)', null, text.slice(cursor));
    }
    const total = Buffer.byteLength(code);
    const totalGzip = zlib.gzipSync(code, { level: 9 }).length;
    const totalBr = zlib.brotliCompressSync(code).length;
    const buckets = Object.entries(pieces).map(([bucket, arr]) => {
      const s = arr.join('');
      return { bucket, minified: Buffer.byteLength(s), gzipAlone: zlib.gzipSync(s, { level: 9 }).length };
    });
    const gzSum = buckets.reduce((a, b) => a + b.gzipAlone, 0);
    for (const b of buckets) {
      b.share = b.minified / total;
      // Standalone gzip of each bucket overstates it; scale so the buckets sum to the real chunk gzip.
      b.gzipScaled = Math.round((b.gzipAlone / gzSum) * totalGzip);
    }
    buckets.sort((a, b) => b.minified - a.minified);
    const topSources = Object.entries(bySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([s, n]) => ({ source: s.replace(/^.*?(node_modules|src)\//, '$1/'), minified: n }));
    out[f] = { total, totalGzip, totalBrotli: totalBr, buckets, topSources };
    const kb = (n) => (n / 1024).toFixed(1).padStart(7);
    console.log(`\n== ${f}: ${kb(total)} KB min, ${kb(totalGzip)} KB gzip, ${kb(totalBr)} KB brotli`);
    for (const b of buckets) console.log(`  ${b.bucket.padEnd(58)} ${kb(b.minified)} KB  ${(b.share * 100).toFixed(1).padStart(5)}%  ~${kb(b.gzipScaled)} KB gz`);
    console.log('  top sources:');
    for (const s of topSources.slice(0, 12)) console.log(`    ${kb(s.minified)} KB  ${s.source}`);
  }
  fs.writeFileSync('docs/overhaul/audit/perf/bundle-minified-breakdown.json', JSON.stringify(out, null, 2));
} else if (cmd === 'resolve') {
  for (const pos of rest) {
    const [prefix, line, col] = pos.split(':');
    const { map } = loadChunk(prefix);
    const o = map.originalPositionFor({ line: Number(line), column: Number(col) });
    console.log(`${pos} -> ${o.source?.replace(/^.*?(node_modules|src)\//, '$1/')}:${o.line}:${o.column} ${o.name ?? ''}`);
  }
}
