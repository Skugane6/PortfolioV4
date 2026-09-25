// Fails if the JavaScript the page loads up front exceeds the budget.
// "Up front" is the entry script plus its static imports; lazy chunks (demos,
// Motion features, the skill logos) are listed but not counted.
//
//   npm run build && node scripts/check-bundle.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGET_KB = 200;
const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const entry = html.match(/s\.src='\/assets\/([^']+\.js)'/)?.[1] ?? html.match(/src="\/assets\/([^"]+\.js)"/)?.[1];
if (!entry) throw new Error('could not find the entry script in dist/index.html');

const gz = (file) => zlib.gzipSync(fs.readFileSync(path.join(dist, 'assets', file)), { level: 9 }).length;

// Static imports of the entry, recursively (Vite emits them as import statements at the top).
const initial = new Set([entry]);
const queue = [entry];
while (queue.length) {
  const src = fs.readFileSync(path.join(dist, 'assets', queue.shift()), 'utf8');
  for (const m of src.matchAll(/(?:^|[;\n])import\s*(?:[^'"()]*from\s*)?["']\.\/([^"']+\.js)["']/g)) {
    if (!initial.has(m[1])) {
      initial.add(m[1]);
      queue.push(m[1]);
    }
  }
}

let total = 0;
for (const file of fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.js'))) {
  const size = gz(file);
  const up = initial.has(file);
  if (up) total += size;
  console.log(`${up ? 'initial' : 'lazy   '}  ${(size / 1024).toFixed(1).padStart(6)} KB gz  ${file}`);
}
console.log(`\ninitial JavaScript: ${(total / 1024).toFixed(1)} KB gzip (budget ${BUDGET_KB} KB)`);
if (total / 1024 > BUDGET_KB) {
  console.error('over budget');
  process.exit(1);
}
