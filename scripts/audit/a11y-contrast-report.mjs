// Aggregates contrast-<width>.json (from a11y-contrast.mjs) into grouped
// tables. Prints markdown to stdout and writes contrast-summary.json.
//
//   node scripts/audit/a11y-contrast-report.mjs [dir] [--widths=375,1440]
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--')) ?? 'docs/overhaul/audit/a11y';
const widthsArg = args.find((a) => a.startsWith('--widths='));
const widths = widthsArg ? widthsArg.split('=')[1].split(',').map(Number) : [375, 1440];

const isLarge = (r) => r.renderedPx >= 24 || (r.renderedPx >= 18.66 && r.weight >= 700);
const need = (r) => (isLarge(r) ? 3 : 4.5);
const isLabel = (r) => r.family === 'mono' || (r.upper && r.lsEm >= 0.08);
// The hero's 3D stage and IDE frame are aria-hidden pictures of UI; WCAG
// 1.4.3 exempts text that is part of a picture with other significant visual
// content. Reported, but kept out of the failure counts.
const isDecorativeScene = (r) => /Hero stage|Hero IDE/.test(r.component);
const fmt = (n, d = 1) => (n == null ? '–' : Number(n).toFixed(d));
const esc = (s) => String(s).replace(/\|/g, '\\|');

const summary = {};
let md = '';

for (const width of widths) {
  const data = JSON.parse(await fs.readFile(path.join(dir, `contrast-${width}.json`), 'utf8'));
  const all = data.records;
  const recs = all.filter((r) => !isDecorativeScene(r));
  const scene = all.filter(isDecorativeScene);
  const under12 = recs.filter((r) => r.renderedPx < 12);
  const labels13 = recs.filter((r) => r.renderedPx < 13 && isLabel(r));
  const fails = recs.filter((r) => r.pixel.median < need(r));
  const borderline = recs.filter((r) => r.pixel.median >= need(r) && r.pixel.median < need(r) + 0.5);
  const walkFails = recs.filter((r) => r.walkResult.crLightStop < need(r));
  const sceneFails = scene.filter((r) => r.pixel.median < need(r));

  const byComp = (list) => {
    const m = new Map();
    for (const r of list) {
      if (!m.has(r.component)) m.set(r.component, []);
      m.get(r.component).push(r);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  };
  const sig = (r) => `${fmt(r.renderedPx)}px ${r.family} ${r.colorHex}${r.color[3] < 1 ? `@${fmt(r.color[3], 2)}` : ''} ls ${fmt(r.lsEm, 2)}em`;

  summary[width] = {
    textNodes: all.length,
    excludedDecorativeScene: scene.length,
    audited: recs.length,
    under12: under12.length,
    labelsUnder13: labels13.length,
    under10: recs.filter((r) => r.renderedPx < 10).length,
    fails: fails.length,
    borderline: borderline.length,
    walkLightStopFails: walkFails.length,
    sceneFails: sceneFails.length,
    ariaHiddenUnder12: under12.filter((r) => r.ariaHidden).length,
    sizeHistogram: Object.fromEntries(
      ['<8', '8-9', '9-10', '10-11', '11-12', '12-13', '13-16', '>=16'].map((b) => [b, 0]),
    ),
  };
  for (const r of recs) {
    const p = r.renderedPx;
    const b = p < 8 ? '<8' : p < 9 ? '8-9' : p < 10 ? '9-10' : p < 11 ? '10-11' : p < 12 ? '11-12' : p < 13 ? '12-13' : p < 16 ? '13-16' : '>=16';
    summary[width].sizeHistogram[b]++;
  }

  md += `\n### ${width}px (${data.states} scroll states, ${all.length} distinct visible text nodes; ${scene.length} in the aria-hidden hero scene excluded)\n\n`;
  md += `| metric | count | share of audited |\n|---|---|---|\n`;
  const share = (n) => `${Math.round((n / recs.length) * 100)}%`;
  md += `| audited text nodes | ${recs.length} | 100% |\n`;
  md += `| rendered < 12px | ${under12.length} | ${share(under12.length)} |\n`;
  md += `| rendered < 10px | ${summary[width].under10} | ${share(summary[width].under10)} |\n`;
  md += `| "label" (mono, or uppercase with ≥0.08em tracking) < 13px | ${labels13.length} | ${share(labels13.length)} |\n`;
  md += `| contrast fail (pixel median < 4.5 / 3) | ${fails.length} | ${share(fails.length)} |\n`;
  md += `| borderline (passes by < 0.5) | ${borderline.length} | ${share(borderline.length)} |\n`;
  md += `| walk-method fail (light gradient stop) | ${walkFails.length} | ${share(walkFails.length)} |\n`;
  md += `| aria-hidden hero scene: fails / total | ${sceneFails.length} / ${scene.length} | – |\n\n`;
  md += `Size histogram (rendered px): ${Object.entries(summary[width].sizeHistogram).map(([k, v]) => `${k}: ${v}`).join(' · ')}\n\n`;

  md += `#### (a) Text rendered under 12px, ${width}px, by component\n\n| component | n | size range px | min contrast | examples |\n|---|---|---|---|---|\n`;
  for (const [comp, list] of byComp(under12)) {
    const sizes = list.map((r) => r.renderedPx);
    const ex = [...new Set(list.map((r) => `"${r.text.slice(0, 28)}" ${fmt(r.renderedPx)}px`))].slice(0, 3).join('; ');
    md += `| ${esc(comp)}${list.some((r) => r.ariaHidden) ? ' †' : ''} | ${list.length} | ${fmt(Math.min(...sizes))}–${fmt(Math.max(...sizes))} | ${fmt(Math.min(...list.map((r) => r.pixel.median)), 2)} | ${esc(ex)} |\n`;
  }
  md += `\n† some or all of these nodes sit inside an aria-hidden subtree.\n\n`;

  md += `#### (b) Labels under 13px, ${width}px, by style signature (top 20)\n\n| component | signature | n | contrast (px median) | examples |\n|---|---|---|---|---|\n`;
  const sigMap = new Map();
  for (const r of labels13) {
    const k = `${r.component}::${sig(r)}`;
    if (!sigMap.has(k)) sigMap.set(k, []);
    sigMap.get(k).push(r);
  }
  for (const [k, list] of [...sigMap.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20)) {
    const [comp, s] = k.split('::');
    const ex = [...new Set(list.map((r) => `"${r.text.slice(0, 24)}"`))].slice(0, 3).join(', ');
    md += `| ${esc(comp)} | ${esc(s)} | ${list.length} | ${fmt(Math.min(...list.map((r) => r.pixel.median)), 2)} | ${esc(ex)} |\n`;
  }

  md += `\n#### (c) Contrast failures, ${width}px\n\n| component | text | rendered px | fg | bg (pixel mean) | px median | px p10 | walk light/dark stop | need |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of [...fails].sort((a, b) => a.pixel.median - b.pixel.median)) {
    md += `| ${esc(r.component)}${r.ariaHidden ? ' †' : ''} | "${esc(r.text.slice(0, 34))}" | ${fmt(r.renderedPx)} | ${r.colorHex}${r.color[3] < 1 ? `@${fmt(r.color[3], 2)}` : ''}${r.opacity < 0.99 ? ` op ${fmt(r.opacity, 2)}` : ''} | ${r.pixel.meanBg} | ${fmt(r.pixel.median, 2)} | ${fmt(r.pixel.p10, 2)} | ${fmt(r.walkResult.crLightStop, 2)} / ${fmt(r.walkResult.crDarkStop, 2)} | ${need(r)} |\n`;
  }
  if (borderline.length) {
    md += `\nBorderline passes (within 0.5 of the threshold), ${width}px: `;
    const bl = byComp(borderline).map(([c, l]) => `${c} ${l.length} (min ${fmt(Math.min(...l.map((r) => r.pixel.median)), 2)})`);
    md += bl.join('; ') + '\n';
  }
  if (sceneFails.length) {
    md += `\nAria-hidden hero scene (excluded above), ${width}px: ${sceneFails.length}/${scene.length} nodes under threshold, worst ${fmt(Math.min(...sceneFails.map((r) => r.pixel.median)), 2)}:1; sizes ${fmt(Math.min(...scene.map((r) => r.renderedPx)))}–${fmt(Math.max(...scene.map((r) => r.renderedPx)))}px.\n`;
  }
  summary[width].failures = fails.map((r) => ({ component: r.component, text: r.text, renderedPx: r.renderedPx, fg: r.colorHex, bg: r.pixel.meanBg, median: r.pixel.median, p10: r.pixel.p10, walk: r.walkResult }));
}

await fs.writeFile(path.join(dir, 'contrast-summary.json'), JSON.stringify(summary, null, 2));
process.stdout.write(md);
