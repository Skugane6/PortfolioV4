// axe-core sweep for the accessibility audit.
//
//   node scripts/audit/a11y-axe.mjs [baseUrl] [outDir]
//
// Runs @axe-core/playwright with the WCAG 2.0/2.1/2.2 A+AA tags (and, as a
// separate pass, axe's best-practice rules) at 375x812 and 1440x900, in these
// states: on load, after each section has been scrolled into view (waiting for
// once-only whileInView entrances), Experience mid-survey with callouts
// revealed, Projects with tab 3 selected, and the page bottom.
// Raw results per state go to <outDir>/axe-<width>-<state>.json and a merged
// summary to <outDir>/axe-summary.json.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , baseUrl = 'http://127.0.0.1:5199/', outDir = 'docs/overhaul/audit/a11y'] = process.argv;
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const VIEWPORTS = [
  { width: 375, height: 812, mobile: true },
  { width: 1440, height: 900, mobile: false },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const summary = { baseUrl, axeTags: WCAG_TAGS, runs: [] };

const slim = (results) =>
  results.map((v) => ({
    id: v.id,
    impact: v.impact,
    tags: v.tags,
    help: v.help,
    helpUrl: v.helpUrl,
    count: v.nodes.length,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      html: n.html.slice(0, 300),
      failureSummary: n.failureSummary,
      any: n.any.map((c) => ({ id: c.id, message: c.message, data: c.data })),
    })),
  }));

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(2000);

  const scrollToSection = async (id, frac = 0) => {
    await page.evaluate(
      ({ sid, f }) => {
        const el = document.getElementById(sid);
        const top = el.getBoundingClientRect().top + window.scrollY;
        const travel = Math.max(0, el.offsetHeight - window.innerHeight);
        window.scrollTo(0, Math.max(0, top + travel * f - 40));
      },
      { sid: id, f: frac },
    );
    await sleep(80);
    await page.evaluate(
      ({ sid, f }) => {
        const el = document.getElementById(sid);
        const top = el.getBoundingClientRect().top + window.scrollY;
        const travel = Math.max(0, el.offsetHeight - window.innerHeight);
        window.scrollTo(0, top + travel * f);
      },
      { sid: id, f: frac },
    );
    await sleep(1600);
  };

  const states = [
    ['load', async () => {}],
    ['experience-top', async () => scrollToSection('experience', 0)],
    ['experience-mid', async () => scrollToSection('experience', 0.55)],
    ['projects', async () => scrollToSection('projects')],
    [
      'projects-tab3',
      async () => {
        await scrollToSection('projects');
        await page.locator('#projects button[type="button"]').nth(2).click();
        await sleep(1400);
      },
    ],
    ['skills', async () => scrollToSection('skills')],
    ['contact', async () => scrollToSection('contact')],
    [
      'bottom',
      async () => {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await sleep(1400);
      },
    ],
  ];

  for (const [name, setup] of states) {
    await setup();
    const scrollY = await page.evaluate(() => Math.round(window.scrollY));
    const wcag = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const bp = await new AxeBuilder({ page }).withTags(['best-practice']).analyze();
    const record = {
      width: vp.width,
      state: name,
      scrollY,
      wcagViolations: slim(wcag.violations),
      wcagIncomplete: slim(wcag.incomplete),
      bestPracticeViolations: slim(bp.violations),
      passes: wcag.passes.map((p) => p.id),
    };
    await fs.writeFile(path.join(outDir, `axe-${vp.width}-${name}.json`), JSON.stringify(record, null, 2));
    summary.runs.push({
      width: vp.width,
      state: name,
      scrollY,
      wcag: record.wcagViolations.map((v) => ({ id: v.id, impact: v.impact, count: v.count, targets: v.nodes.slice(0, 6).map((n) => n.target.join(' ')) })),
      incomplete: record.wcagIncomplete.map((v) => ({ id: v.id, count: v.count })),
      bestPractice: record.bestPracticeViolations.map((v) => ({ id: v.id, impact: v.impact, count: v.count, targets: v.nodes.slice(0, 6).map((n) => n.target.join(' ')) })),
    });
    console.log(
      `${vp.width} ${name} y=${scrollY}: wcag=${record.wcagViolations.map((v) => `${v.id}(${v.count})`).join(',') || 'none'} | incomplete=${record.wcagIncomplete.map((v) => `${v.id}(${v.count})`).join(',') || 'none'} | bp=${record.bestPracticeViolations.map((v) => `${v.id}(${v.count})`).join(',') || 'none'}`,
    );
  }
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, 'axe-summary.json'), JSON.stringify(summary, null, 2));
console.log('wrote', path.join(outDir, 'axe-summary.json'));
