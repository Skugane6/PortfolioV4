// Lighthouse against the production build, served in-process and shut down
// afterwards (nothing left running).
//
//   npm run build && node scripts/audit/lh-after.mjs [--runs=3] [--out=docs/overhaul/audit/perf-after]
import { preview } from 'vite';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const RUNS = Number(args.runs ?? 3);
const OUT = path.resolve(args.out ?? 'docs/overhaul/audit/perf-after');
await fs.mkdir(OUT, { recursive: true });

const server = await preview({ preview: { port: 4198, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
const url = server.resolvedUrls.local[0];
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromeFlags: ['--headless=new', '--disable-extensions'],
});

const pick = (lhr) => {
  const a = lhr.audits;
  return {
    scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    cls: Number(a['cumulative-layout-shift'].numericValue.toFixed(3)),
    si: Math.round(a['speed-index'].numericValue),
    lcpElement: a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel ?? null,
    failing: Object.values(a)
      .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable')
      .map((x) => `${x.id}: ${x.displayValue ?? x.score}`),
  };
};

const summary = {};
try {
  for (const form of ['mobile', 'desktop']) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const config = form === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
      const result = await lighthouse(url, { port: chrome.port, output: i === 0 ? ['json', 'html'] : 'json', logLevel: 'error' }, config);
      const [json, html] = Array.isArray(result.report) ? result.report : [result.report];
      await fs.writeFile(path.join(OUT, `lh-${form}-${i + 1}.json`), json);
      if (html) await fs.writeFile(path.join(OUT, `lh-${form}-${i + 1}.html`), html);
      runs.push(pick(result.lhr));
      console.log(form, i + 1, JSON.stringify({ ...runs.at(-1), failing: undefined }));
    }
    const median = [...runs].sort((a, b) => a.scores.performance - b.scores.performance)[Math.floor(runs.length / 2)];
    summary[form] = { median, runs };
  }
} finally {
  await chrome.kill();
  await new Promise((r) => server.httpServer.close(r));
}
await fs.writeFile(path.join(OUT, 'lighthouse-summary.json'), JSON.stringify(summary, null, 2));
for (const [form, { median }] of Object.entries(summary)) {
  console.log(`\n${form} median:`, JSON.stringify(median.scores), `FCP ${median.fcp} LCP ${median.lcp} TBT ${median.tbt} CLS ${median.cls} SI ${median.si}`);
  console.log('  LCP element:', median.lcpElement);
  console.log('  below 0.9:', median.failing.join(' | ') || 'none');
}
