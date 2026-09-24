// Lighthouse runs for the performance audit.
//
//   node scripts/audit/perf-lighthouse.mjs [--runs=3] [--local=http://127.0.0.1:4199/] [--prod=https://searan.vercel.app/] [--only=local|prod]
//
// Local preview: mobile (default config) x runs, desktop (--preset=desktop) x runs.
// Production: one mobile, one desktop. JSON for every run, HTML for run 1 of each
// config, then a summary (per-run and median) in docs/overhaul/audit/perf/lighthouse-summary.json.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const RUNS = Number(args.runs ?? 3);
const LOCAL = args.local ?? 'http://127.0.0.1:4199/';
const PROD = args.prod ?? 'https://searan.vercel.app/';
const OUT = path.resolve('docs/overhaul/audit/perf');
fs.mkdirSync(OUT, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function run(url, preset, label, html) {
  const base = path.join(OUT, `lh-${label}`);
  const cli = [
    'lighthouse',
    url,
    '--quiet',
    // shell: true on Windows goes through cmd.exe, so the flag list needs quoting.
    '"--chrome-flags=--headless=new --disable-extensions"',
    '--output=json',
    ...(html ? ['--output=html'] : []),
    `--output-path=${base}`,
  ];
  if (preset === 'desktop') cli.push('--preset=desktop');
  const t0 = Date.now();
  const r = spawnSync('npx', cli, {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: true,
    env: { ...process.env, CHROME_PATH: CHROME },
  });
  // With a single output Lighthouse writes exactly base; with two it appends .report.<ext>.
  const jsonPath = html ? `${base}.report.json` : base;
  const finalJson = `${base}.json`;
  if (fs.existsSync(jsonPath) && jsonPath !== finalJson) fs.renameSync(jsonPath, finalJson);
  if (html && fs.existsSync(`${base}.report.html`)) fs.renameSync(`${base}.report.html`, `${base}.html`);
  console.log(`${label}: exit ${r.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return finalJson;
}

function extract(file) {
  const lhr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const a = lhr.audits;
  const num = (id) => a[id]?.numericValue ?? null;
  const lcpEl = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node;
  return {
    file: path.basename(file),
    fetchTime: lhr.fetchTime,
    runtimeError: lhr.runtimeError?.message ?? null,
    scores: Object.fromEntries(
      Object.entries(lhr.categories).map(([k, c]) => [k, c.score === null ? null : Math.round(c.score * 100)])
    ),
    fcp: num('first-contentful-paint'),
    lcp: num('largest-contentful-paint'),
    tbt: num('total-blocking-time'),
    cls: num('cumulative-layout-shift'),
    si: num('speed-index'),
    tti: num('interactive'),
    lcpElement: lcpEl ? { selector: lcpEl.selector, snippet: lcpEl.snippet, nodeLabel: lcpEl.nodeLabel } : null,
    benchmarkIndex: lhr.environment?.benchmarkIndex,
  };
}

const median = (xs) => {
  const s = xs.filter((x) => x !== null && x !== undefined).sort((p, q) => p - q);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function summarise(runs) {
  const keys = ['fcp', 'lcp', 'tbt', 'cls', 'si', 'tti'];
  const out = { runs, median: {} };
  for (const k of keys) out.median[k] = median(runs.map((r) => r[k]));
  out.median.scores = {};
  for (const cat of Object.keys(runs[0].scores)) out.median.scores[cat] = median(runs.map((r) => r.scores[cat]));
  // The run whose perf score is the median, for opportunities/diagnostics.
  const sorted = [...runs].sort((p, q) => p.scores.performance - q.scores.performance);
  out.medianRun = sorted[Math.floor(sorted.length / 2)].file;
  return out;
}

const summaryPath = path.join(OUT, 'lighthouse-summary.json');
const summary = fs.existsSync(summaryPath) ? JSON.parse(fs.readFileSync(summaryPath, 'utf8')) : {};

if (args.only !== 'prod') {
  for (const preset of ['mobile', 'desktop']) {
    const runs = [];
    for (let i = 1; i <= RUNS; i++) runs.push(extract(run(LOCAL, preset, `local-${preset}-${i}`, i === 1)));
    summary[`local-${preset}`] = summarise(runs);
  }
}
if (args.only !== 'local') {
  for (const preset of ['mobile', 'desktop']) {
    summary[`prod-${preset}`] = summarise([extract(run(PROD, preset, `prod-${preset}-1`, true))]);
  }
}
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, v.median])), null, 2));
