// Groups the visualizer's raw-data output into the buckets the audit reports.
//
//   node scripts/audit/perf-bundle.mjs [docs/overhaul/audit/perf/bundle-stats.json]
//
// Writes docs/overhaul/audit/perf/bundle-breakdown.json and prints a table.
// Sizes are per-module rendered/gzip/brotli as rollup-plugin-visualizer
// measures them (each module compressed on its own, so the gzip column sums
// to more than the chunk's real gzip size; shares are what matter).
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] ?? 'docs/overhaul/audit/perf/bundle-stats.json';
const stats = JSON.parse(fs.readFileSync(file, 'utf8'));

const bucketOf = (id) => {
  const p = id.split(String.fromCharCode(92)).join('/');
  if (p.includes('/node_modules/framer-motion/')) return 'framer-motion';
  if (p.includes('/node_modules/motion-dom/') || p.includes('/node_modules/motion-utils/')) return 'framer-motion (motion-dom/utils)';
  if (p.includes('/node_modules/react-dom/')) return 'react-dom';
  if (p.includes('/node_modules/react/')) return 'react';
  if (p.includes('/node_modules/scheduler/')) return 'scheduler';
  if (p.includes('/node_modules/')) return 'other node_modules: ' + p.split('/node_modules/').pop().split('/')[0];
  if (p.includes('/src/data/skillIcons')) return 'src/data/skillIcons (SVG path data)';
  if (p.includes('/src/data/contactIcons')) return 'src/data/contactIcons';
  if (p.includes('/src/oneko/') && p.endsWith('.json')) return 'oneko sprite sheets (base64 JSON)';
  if (p.includes('/src/oneko/')) return 'oneko code';
  if (p.includes('/src/data/')) return 'src/data (content)';
  if (p.includes('/src/components/experience/') || p.endsWith('/Experience.tsx')) return 'app: Experience';
  if (p.includes('/src/components/hero/') || p.endsWith('/Hero.tsx')) return 'app: Hero';
  if (p.includes('/src/components/projects/') || p.endsWith('/Projects.tsx')) return 'app: Projects';
  if (p.includes('/src/components/skills/') || p.endsWith('/Skills.tsx')) return 'app: Skills';
  if (p.includes('/src/')) return 'app: other src';
  return 'other: ' + p;
};

const chunks = {};
for (const [, meta] of Object.entries(stats.nodeMetas)) {
  for (const [bundle, partUid] of Object.entries(meta.moduleParts)) {
    const part = stats.nodeParts[partUid];
    const c = (chunks[bundle] ??= { total: { rendered: 0, gzip: 0, brotli: 0 }, buckets: {}, topModules: [] });
    const b = (c.buckets[bucketOf(meta.id)] ??= { rendered: 0, gzip: 0, brotli: 0, modules: 0 });
    b.rendered += part.renderedLength;
    b.gzip += part.gzipLength;
    b.brotli += part.brotliLength;
    b.modules += 1;
    c.total.rendered += part.renderedLength;
    c.total.gzip += part.gzipLength;
    c.total.brotli += part.brotliLength;
    c.topModules.push({ id: meta.id.split(String.fromCharCode(92)).join('/').replace(/^.*PortfolioV3\//, ''), rendered: part.renderedLength, gzip: part.gzipLength });
  }
}
for (const c of Object.values(chunks)) {
  c.topModules = c.topModules.sort((a, b) => b.rendered - a.rendered).slice(0, 25);
}

const kb = (n) => (n / 1024).toFixed(1);
for (const [name, c] of Object.entries(chunks)) {
  console.log(`\n== ${name}  rendered ${kb(c.total.rendered)} KB, sum of per-module gzip ${kb(c.total.gzip)} KB`);
  const rows = Object.entries(c.buckets).sort((a, b) => b[1].rendered - a[1].rendered);
  for (const [k, v] of rows) {
    console.log(
      `${k.padEnd(44)} ${kb(v.rendered).padStart(8)} KB  ${((v.rendered / c.total.rendered) * 100).toFixed(1).padStart(5)}%   gz ${kb(v.gzip).padStart(7)} KB  (${v.modules} modules)`
    );
  }
  console.log('  top modules:');
  for (const m of c.topModules.slice(0, 12)) console.log(`    ${kb(m.rendered).padStart(8)} KB  ${m.id}`);
}
fs.writeFileSync(path.join(path.dirname(file), 'bundle-breakdown.json'), JSON.stringify(chunks, null, 2));
