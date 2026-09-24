// Audit helper: per-file code statistics for src/ (excluding tests).
//   - colour literals: hex (#rgb/#rrggbb/#rrggbbaa) and rgb()/rgba() calls
//   - how many of those literals equal a token value from src/styles/index.css
//   - inline style={{ … }} objects
//   - comment density (comment lines / non-blank lines)
// Read-only; prints Markdown to stdout.
//
//   node scripts/audit/content-codestats.mjs [--include-oneko] [--include-generated]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const includeOneko = process.argv.includes('--include-oneko');
const includeGenerated = process.argv.includes('--include-generated');

function walk(p) {
  const s = statSync(p);
  if (s.isFile()) return [p];
  return readdirSync(p).flatMap((n) => walk(join(p, n)));
}

const GENERATED = ['src/data/skillIcons.ts', 'src/data/contactIcons.ts'];
const files = walk(join(root, 'src'))
  .map((f) => relative(root, f).replaceAll('\\', '/'))
  .filter((f) => /\.(tsx?|css)$/.test(f))
  .filter((f) => !/\.test\.tsx?$/.test(f) && !f.startsWith('src/test/'))
  .filter((f) => includeOneko || !f.startsWith('src/oneko/'))
  .filter((f) => includeGenerated || !GENERATED.includes(f));

// Token values, normalised, from the :root block in index.css.
const css = readFileSync(join(root, 'src/styles/index.css'), 'utf8');
const tokenValues = new Map();
for (const m of css.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)) tokenValues.set(norm(m[2]), `--color-${m[1]}`);

function norm(c) {
  c = c.trim().toLowerCase().replace(/\s+/g, '');
  const short = c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (short) c = `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  // rgba(1,2,3,.5) and rgba(1,2,3,0.5) are the same colour.
  c = c.replace(/,0?\.(\d)/g, ',.$1');
  return c;
}

const HEX = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g;
const RGB = /rgba?\([^)]*\)/g;

const perFile = [];
const all = new Map(); // normalised colour -> Set(files)
let totalOccurrences = 0;

for (const f of files) {
  const text = readFileSync(join(root, f), 'utf8');
  const lines = text.split('\n');
  const nonBlank = lines.filter((l) => l.trim()).length;
  // Comment lines: // lines, /* */ and JSX {/* */} blocks, JSDoc bodies.
  let inBlock = false;
  let commentLines = 0;
  for (const raw of lines) {
    const l = raw.trim();
    if (inBlock) {
      commentLines++;
      if (l.includes('*/')) inBlock = false;
      continue;
    }
    if (l.startsWith('//')) commentLines++;
    else if (l.startsWith('/*') || l.startsWith('{/*')) {
      commentLines++;
      if (!l.includes('*/')) inBlock = true;
    }
  }
  // Strip line comments before counting colours so prose like "#050b16 (6.7:1)"
  // in a comment is not counted as a literal.
  const code = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
  // Hex literals inside `d="M…"` path data or entity strings are not colours;
  // only count hex that sits in a quote, template, or css value.
  const colours = [...code.matchAll(HEX), ...code.matchAll(RGB)].map((m) => norm(m[0]));
  totalOccurrences += colours.length;
  colours.forEach((c) => {
    if (!all.has(c)) all.set(c, new Set());
    all.get(c).add(f);
  });
  const tokenHits = colours.filter((c) => tokenValues.has(c)).length;
  const inlineStyles = (code.match(/style=\{\{/g) || []).length + (code.match(/style=\{[a-zA-Z(]/g) || []).length;
  const arbitrary = (code.match(/-\[[^\]]*(#|rgba?\()[^\]]*\]/g) || []).length;
  perFile.push({
    f,
    lines: lines.length,
    colours: colours.length,
    distinct: new Set(colours).size,
    tokenHits,
    inlineStyles,
    arbitrary,
    commentPct: nonBlank ? Math.round((commentLines / nonBlank) * 100) : 0,
    commentLines,
  });
}

perFile.sort((a, b) => b.lines - a.lines);
console.log(`Files: ${files.length}${includeOneko ? ' (incl. oneko)' : ' (excl. src/oneko)'}${includeGenerated ? ' (incl. generated icons)' : ' (excl. generated icon data)'}\n`);
console.log('| File | Lines | Comment lines (% of non-blank) | style={} | Colour literals (distinct) | …equal to an index.css token | Tailwind arbitrary colour classes |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const r of perFile) {
  console.log(`| \`${r.f}\` | ${r.lines} | ${r.commentLines} (${r.commentPct}%) | ${r.inlineStyles} | ${r.colours} (${r.distinct}) | ${r.tokenHits} | ${r.arbitrary} |`);
}
const sum = (k) => perFile.reduce((s, r) => s + r[k], 0);
const distinctAll = all.size;
const distinctTokens = [...all.keys()].filter((c) => tokenValues.has(c)).length;
console.log(`\n**Totals:** ${sum('lines')} lines, ${sum('commentLines')} comment lines, ${sum('inlineStyles')} inline style props, ${totalOccurrences} colour-literal occurrences, **${distinctAll} distinct colour values**, of which ${distinctTokens} equal a token value in index.css (${[...tokenValues.values()].length} colour tokens defined). ${sum('arbitrary')} Tailwind arbitrary-value colour classes.`);

const hexes = [...all.keys()].filter((c) => c.startsWith('#'));
const rgbs = [...all.keys()].filter((c) => c.startsWith('rgb'));
console.log(`\nDistinct hex: ${hexes.length}; distinct rgb()/rgba(): ${rgbs.length}`);
const multi = [...all.entries()].filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size);
console.log(`\nColours repeated across files (${multi.length}):`);
for (const [c, s] of multi.slice(0, 25)) console.log(`- \`${c}\` × ${s.size} files${tokenValues.has(c) ? ` (= ${tokenValues.get(c)})` : ''}`);
