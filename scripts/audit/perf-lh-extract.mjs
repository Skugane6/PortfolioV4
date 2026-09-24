// Pulls the opportunities/diagnostics the audit reports out of Lighthouse JSON.
//
//   node scripts/audit/perf-lh-extract.mjs docs/overhaul/audit/perf/lh-local-mobile-1.json [...more]
//
// Prints failing/informative performance audits with their headline numbers and
// the top rows of each table, plus LCP phases and main-thread breakdown, and
// writes <file>.extract.json next to each input.
import fs from 'node:fs';

const ids = [
  'render-blocking-resources', 'render-blocking-insight',
  'unused-javascript', 'unused-css-rules', 'unminified-javascript', 'legacy-javascript', 'duplicated-javascript',
  'modern-image-formats', 'uses-optimized-images', 'uses-responsive-images', 'offscreen-images', 'efficient-animated-content', 'image-delivery-insight',
  'unsized-images', 'font-display', 'font-display-insight',
  'uses-long-cache-ttl', 'cache-insight', 'uses-text-compression', 'total-byte-weight',
  'mainthread-work-breakdown', 'bootup-time', 'third-party-summary', 'third-parties-insight',
  'largest-contentful-paint-element', 'lcp-phases-insight', 'lcp-discovery-insight', 'prioritize-lcp-image', 'lcp-lazy-loaded',
  'critical-request-chains', 'network-dependency-tree-insight', 'uses-rel-preconnect',
  'non-composited-animations', 'layout-shifts', 'cls-culprits-insight', 'dom-size', 'dom-size-insight',
  'long-tasks', 'forced-reflow-insight', 'server-response-time', 'document-latency-insight', 'redirects', 'viewport', 'viewport-insight',
  'network-rtt', 'network-server-latency',
];

const brief = (v) => {
  if (v === null || v === undefined) return v;
  if (typeof v === 'object') {
    if (v.type === 'node') return v.selector ?? v.nodeLabel;
    if (v.type === 'source-location') return `${v.url}:${v.line}:${v.column}`;
    if (v.type === 'url') return v.value;
    if (v.type === 'code') return v.value;
    if (v.type === 'text') return v.value;
    return JSON.stringify(v).slice(0, 120);
  }
  return typeof v === 'number' ? Math.round(v * 10) / 10 : String(v).slice(0, 140);
};

for (const file of process.argv.slice(2)) {
  const lhr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = { file, finalUrl: lhr.finalDisplayedUrl, formFactor: lhr.configSettings.formFactor, throttling: lhr.configSettings.throttling, audits: {} };
  console.log(`\n######## ${file} (${out.formFactor})`);
  for (const id of ids) {
    const a = lhr.audits[id];
    if (!a) continue;
    const items = Array.isArray(a.details?.items) ? a.details.items : [];
    const rows = items.slice(0, 12).map((it) => {
      const o = {};
      for (const [k, v] of Object.entries(it)) {
        if (k === 'subItems') {
          o.subItems = (v.items ?? []).slice(0, 6).map((s) => Object.fromEntries(Object.entries(s).map(([sk, sv]) => [sk, brief(sv)])));
        } else if (k === 'items' && Array.isArray(v)) {
          o.items = v.slice(0, 6).map((s) => (typeof s === 'object' ? Object.fromEntries(Object.entries(s).map(([sk, sv]) => [sk, brief(sv)])) : s));
        } else o[k] = brief(v);
      }
      return o;
    });
    out.audits[id] = {
      title: a.title,
      score: a.score,
      displayValue: a.displayValue ?? null,
      numericValue: a.numericValue ?? null,
      overallSavingsMs: a.details?.overallSavingsMs ?? a.metricSavings ?? null,
      overallSavingsBytes: a.details?.overallSavingsBytes ?? null,
      rows,
    };
    const flag = a.score === null ? 'info' : a.score >= 0.9 ? 'pass' : 'FAIL';
    console.log(`\n[${flag}] ${id}: ${a.title} ${a.displayValue ? '— ' + a.displayValue : ''}${a.metricSavings ? ' savings ' + JSON.stringify(a.metricSavings) : ''}`);
    for (const r of rows.slice(0, 8)) console.log('   ', JSON.stringify(r).slice(0, 400));
  }
  fs.writeFileSync(file.replace(/\.json$/, '.extract.json'), JSON.stringify(out, null, 2));
}
