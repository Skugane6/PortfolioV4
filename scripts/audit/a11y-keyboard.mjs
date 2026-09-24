// Keyboard-only audit.
//
//   node scripts/audit/a11y-keyboard.mjs [baseUrl] [outDir] [shotDir]
//
// Per width (1440x900 and 375x812; the 375 run is a narrowed desktop browser,
// i.e. no touch emulation, which is what a keyboard user at high zoom gets):
//  1. Tab from the top of the page until focus wraps, logging tag, role and
//     accessible name (from Chromium's AX tree via CDP), section, rect,
//     on-screen, effective opacity at focus time and 700ms later, whether a
//     focus indicator differs from the unfocused style (outline / box-shadow),
//     and whether the focused element is covered by something else at its
//     centre (WCAG 2.4.11). A clip of every focus state is saved.
//  2. Experience: traverse the pinned section with PageDown, then ArrowDown,
//     recording scrollY, the readout, and each callout's reveal alpha, so
//     skipped callouts and press counts are measured, not guessed.
//  3. Projects: ArrowLeft/Right handling with focus in various places, and
//     whether focus survives the panel remount.
//  4. Skills: tabbable count, and whether focusing anything changes Detail A-A.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , baseUrl = 'http://127.0.0.1:5199/', outDir = 'docs/overhaul/audit/a11y', shotDir = 'docs/overhaul/screenshots/before/keyboard'] = process.argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(shotDir, { recursive: true });

const browser = await chromium.launch();
const report = { baseUrl, runs: [] };

const slug = (s) => String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);

for (const vp of [
  { width: 1440, height: 900 },
  { width: 375, height: 812 },
]) {
  const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('Accessibility.enable');
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(2000);

  const run = { width: vp.width, height: vp.height, focusOrder: [], experience: {}, projects: {}, skills: {}, consoleErrors };

  // Baseline (unfocused) indicator styles for every potentially focusable node.
  await page.evaluate(() => {
    const m = new Map();
    document.querySelectorAll('a[href], button, [tabindex], input, select, textarea, summary').forEach((el) => {
      const cs = getComputedStyle(el);
      const after = getComputedStyle(el, '::after');
      m.set(el, {
        outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        boxShadow: cs.boxShadow,
        border: cs.borderColor,
        bg: cs.backgroundColor,
        afterTransform: after.transform,
      });
    });
    window.__unfocused = m;
    window.__tabbableCount = [...document.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea, summary')].length;
  });
  run.tabbableCandidates = await page.evaluate(() => window.__tabbableCount);

  const axOfActive = async () => {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.activeElement' });
    if (!result.objectId) return { role: null, name: null };
    const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });
    const ax = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: false });
    const n = ax.nodes.find((x) => x.backendDOMNodeId === node.backendNodeId) ?? ax.nodes[0];
    return { role: n?.role?.value ?? null, name: n?.name?.value ?? null, ignored: n?.ignored ?? null };
  };

  const describeActive = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { body: true, scrollY: Math.round(window.scrollY) };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      let op = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
      const base = window.__unfocused.get(el);
      const after = getComputedStyle(el, '::after');
      const now = {
        outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        boxShadow: cs.boxShadow,
        border: cs.borderColor,
        bg: cs.backgroundColor,
        afterTransform: after.transform,
      };
      const outlineOn = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const changed = base
        ? Object.keys(now).filter((k) => now[k] !== base[k])
        : ['(no baseline)'];
      // Is the outline box clipped by an overflow:hidden/clip ancestor?
      const off = parseFloat(cs.outlineOffset) || 0;
      const ow = parseFloat(cs.outlineWidth) || 0;
      const ring = { l: r.left - off - ow, t: r.top - off - ow, r: r.right + off + ow, b: r.bottom + off + ow };
      let clippedBy = null;
      for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const ncs = getComputedStyle(n);
        if (/(hidden|clip)/.test(ncs.overflow + ncs.overflowX + ncs.overflowY)) {
          const pr = n.getBoundingClientRect();
          if (ring.l < pr.left - 0.5 || ring.t < pr.top - 0.5 || ring.r > pr.right + 0.5 || ring.b > pr.bottom + 0.5) {
            clippedBy = `${n.tagName.toLowerCase()}.${String(n.className).split(' ').slice(0, 3).join('.')}`;
            break;
          }
        }
      }
      // Obscured? Hit-test the centre and four inset points.
      const pts = [
        [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
        [r.left + 3, r.top + 3],
        [r.right - 3, r.top + 3],
        [r.left + 3, r.bottom - 3],
        [r.right - 3, r.bottom - 3],
      ];
      const cover = [];
      for (const [x, y] of pts) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) {
          cover.push('offscreen');
          continue;
        }
        const top = document.elementFromPoint(x, y);
        if (!top || el.contains(top) || top.contains(el)) cover.push(null);
        else cover.push(top.closest('nav') ? 'nav' : `${top.tagName.toLowerCase()}${top.id ? '#' + top.id : ''}`);
      }
      const inView = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      return {
        tag: el.tagName.toLowerCase(),
        href: el.getAttribute('href'),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        section: el.closest('section')?.id ?? (el.closest('nav') ? 'nav' : el.closest('footer') ? 'footer' : 'other'),
        rect: [r.left, r.top, r.width, r.height].map((v) => Math.round(v)),
        inView,
        opacity: +op.toFixed(3),
        visibility: cs.visibility,
        ariaHiddenAncestor: Boolean(el.closest('[aria-hidden="true"]')),
        focusVisibleMatch: el.matches(':focus-visible'),
        outlineOn,
        outline: now.outline,
        changedOnFocus: changed,
        clippedBy,
        cover,
        scrollY: Math.round(window.scrollY),
      };
    });

  // ---- 1. Tab order
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.activeElement?.blur?.();
  });
  await sleep(400);
  let firstKey = null;
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    await sleep(260);
    const d = await describeActive();
    if (d.body) {
      run.focusOrder.push({ step: i + 1, body: true, scrollY: d.scrollY });
      break;
    }
    const ax = await axOfActive();
    await sleep(700);
    const later = await page.evaluate(() => {
      const el = document.activeElement;
      let op = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
      return +op.toFixed(3);
    });
    const key = `${d.tag}|${d.href}|${d.text}|${d.rect[2]}x${d.rect[3]}`;
    if (i > 0 && key === firstKey) {
      run.focusOrder.push({ step: i + 1, wrapped: true });
      break;
    }
    if (i === 0) firstKey = key;
    const entry = { step: i + 1, ...d, role: ax.role, name: ax.name, opacityAfter700ms: later };
    // Clip of the focus state (element rect + margin, clamped to viewport).
    if (d.inView) {
      const [x, y, w, h] = d.rect;
      const pad = 18;
      const clip = {
        x: Math.max(0, x - pad),
        y: Math.max(0, y - pad),
        width: Math.min(vp.width - Math.max(0, x - pad), w + pad * 2),
        height: Math.min(vp.height - Math.max(0, y - pad), h + pad * 2),
      };
      if (clip.width > 4 && clip.height > 4) {
        const file = path.join(shotDir, `${vp.width}-focus-${String(i + 1).padStart(2, '0')}-${slug(ax.name || d.text)}.png`);
        await page.screenshot({ path: file, clip });
        entry.shot = file.replace(/\\/g, '/');
      }
    }
    run.focusOrder.push(entry);
  }
  // Full-viewport examples for the report.
  for (const [label, sel] of [
    ['nav-first', 'nav a'],
    ['hero-cta', '#hero a[href="#projects"]'],
    ['project-tab', '#projects button[type="button"]'],
    ['contact-copy', '#contact button'],
  ]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(200);
    // Focus via keyboard semantics: focus() then a no-op Shift press keeps :focus-visible.
    await page.locator(sel).first().focus();
    await page.keyboard.press('Shift');
    await sleep(900);
    await page.screenshot({ path: path.join(shotDir, `${vp.width}-viewport-${label}.png`) });
  }

  // ---- 2. Experience traversal
  const expInfo = () =>
    page.evaluate(() => {
      const sec = document.getElementById('experience');
      const stage = sec.firstElementChild;
      const r = sec.getBoundingClientRect();
      const a = [1, 2, 3, 4].map((i) => parseFloat(stage.style.getPropertyValue(`--a${i}`) || '0'));
      const readout = sec.querySelector('span.w-9')?.textContent ?? null;
      const proj = document.getElementById('projects').getBoundingClientRect().top;
      return { scrollY: Math.round(window.scrollY), secTop: Math.round(r.top), readout, alphas: a.map((v) => +v.toFixed(2)), projectsTop: Math.round(proj) };
    });
  for (const key of ['PageDown', 'Space', 'ArrowDown']) {
    const top = await page.evaluate(() => document.getElementById('experience').getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => {
      document.activeElement?.blur?.();
      window.scrollTo(0, y - 200);
    }, top);
    await sleep(1200);
    const steps = [];
    const maxA = [0, 0, 0, 0];
    const limit = key === 'ArrowDown' ? 200 : 30;
    const gap = key === 'ArrowDown' ? 90 : 900;
    let presses = 0;
    for (let i = 0; i < limit; i++) {
      await page.keyboard.press(key);
      presses++;
      await sleep(gap);
      const info = await expInfo();
      info.alphas.forEach((v, j) => (maxA[j] = Math.max(maxA[j], v)));
      if (key !== 'ArrowDown' || i % 10 === 9) steps.push({ press: presses, ...info });
      if (info.projectsTop <= 2) break;
    }
    await sleep(1500);
    const final = await expInfo();
    run.experience[key] = { presses, steps, maxAlphaPerCallout: maxA, final };
  }

  // ---- 3. Projects arrow keys
  {
    const activeTab = () =>
      page.evaluate(() => [...document.querySelectorAll('#projects button[type="button"]')].findIndex((b) => b.getAttribute('aria-current') === 'true'));
    const activeDesc = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        return el === document.body ? 'body' : `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 30)}"`;
      });
    const live = () => page.evaluate(() => document.querySelector('#projects [aria-live]')?.textContent ?? null);
    const top = await page.evaluate(() => document.getElementById('projects').getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await sleep(1400);
    const tests = [];
    // a) focus on panel link, press ArrowRight.
    await page.locator('#projects a[target="_blank"]').first().focus();
    let before = { tab: await activeTab(), focus: await activeDesc() };
    await page.keyboard.press('ArrowRight');
    await sleep(500);
    tests.push({ case: 'focus on panel link, ArrowRight', before, after: { tab: await activeTab(), focus: await activeDesc(), live: await live() } });
    // b) focus on a nav rail link while Projects owns the viewport.
    await page.locator('nav a').first().focus();
    before = { tab: await activeTab(), focus: await activeDesc() };
    await page.keyboard.press('ArrowRight');
    await sleep(500);
    tests.push({ case: 'focus on nav rail "01 HOME", ArrowRight', before, after: { tab: await activeTab(), focus: await activeDesc(), live: await live() } });
    // c) focus on tab button 1, ArrowRight: does focus follow the selection?
    await page.locator('#projects button[type="button"]').first().focus();
    before = { tab: await activeTab(), focus: await activeDesc() };
    await page.keyboard.press('ArrowRight');
    await sleep(500);
    tests.push({ case: 'focus on tab button 01, ArrowRight', before, after: { tab: await activeTab(), focus: await activeDesc(), live: await live() } });
    // d) no focus, section partly in view (top at 60% of viewport).
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.evaluate((y) => window.scrollTo(0, y - innerHeight * 0.6), top);
    await sleep(800);
    before = { tab: await activeTab(), focus: await activeDesc(), sectionTopPx: await page.evaluate(() => Math.round(document.getElementById('projects').getBoundingClientRect().top)) };
    await page.keyboard.press('ArrowLeft');
    await sleep(500);
    tests.push({ case: 'no focus, Projects top at 60% of viewport, ArrowLeft', before, after: { tab: await activeTab(), focus: await activeDesc() } });
    // e) Enter/Space on a tab button activates (native button).
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await sleep(600);
    await page.locator('#projects button[type="button"]').nth(3).focus();
    await page.keyboard.press('Enter');
    await sleep(500);
    tests.push({ case: 'Enter on tab button 04', after: { tab: await activeTab(), focus: await activeDesc() } });
    // f) Home/End (tabs pattern keys) on tab button.
    await page.keyboard.press('Home');
    await sleep(500);
    tests.push({ case: 'Home on tab button 04', after: { tab: await activeTab(), focus: await activeDesc(), scrollY: await page.evaluate(() => Math.round(scrollY)) } });
    run.projects.arrowTests = tests;
  }

  // ---- 4. Skills
  run.skills = await page.evaluate(() => {
    const sec = document.getElementById('skills');
    const tabbables = sec.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"]), input, select, textarea');
    const tiles = sec.querySelectorAll('li.skill-tile');
    return {
      tabbableInSkills: tabbables.length,
      tiles: tiles.length,
      tileTabIndex: [...tiles].slice(0, 3).map((t) => t.tabIndex),
      detailPanelHasLiveRegion: Boolean(sec.querySelector('.skill-detail [aria-live]')),
    };
  });
  if (vp.width === 1440) {
    // Programmatic focus on a tile (it has no tabindex, so it cannot take focus).
    run.skills.tileFocusAttempt = await page.evaluate(() => {
      const li = document.querySelector('#skills li.skill-tile');
      li.focus();
      return document.activeElement === li ? 'focused' : 'not focusable';
    });
  }

  report.runs.push(run);
  await context.close();
  console.log(`done ${vp.width}: ${run.focusOrder.length} focus steps`);
}

await browser.close();
await fs.writeFile(path.join(outDir, 'keyboard.json'), JSON.stringify(report, null, 2));
console.log('wrote keyboard.json');
