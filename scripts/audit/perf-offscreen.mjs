// What keeps running when it cannot be seen.
//
//   node scripts/audit/perf-offscreen.mjs [baseUrl=http://127.0.0.1:4199/] [--sm=<sourcemapped build dir>]
//
// Desktop 1440x900 and mobile 375x812, no CPU throttle. At the top of the page after load, and
// scrolled to Contact, each after a settle:
//   - document.getAnimations(): name, play state, infinite or not, target, which section it is in,
//     and whether the target is on screen at all;
//   - requestAnimationFrame and setInterval/setTimeout callers over a 2s window, attributed by the
//     registering call site (mapped to source through the sourcemapped twin build with --sm);
//   - canvases and whether they are on screen;
//   - CDP main-thread metrics over the same window (ms of task/style/layout/script per second).
// Output: docs/overhaul/audit/perf/offscreen.json
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const baseUrl = argv.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:4199/';
const smDir = argv.find((a) => a.startsWith('--sm='))?.slice(5);
const OUT = path.resolve('docs/overhaul/audit/perf');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WINDOW_MS = 2000;

let resolve = null;
if (smDir) {
  const { SourceMapConsumer } = await import('source-map-js');
  const maps = {};
  for (const f of fs.readdirSync(path.join(smDir, 'assets')).filter((x) => x.endsWith('.js.map')))
    maps[f.split('-')[0]] = new SourceMapConsumer(JSON.parse(fs.readFileSync(path.join(smDir, 'assets', f), 'utf8')));
  resolve = (frame) => {
    const m = /\/assets\/([a-z]+)-[^/]+\.js:(\d+):(\d+)/.exec(frame);
    if (!m || !maps[m[1]]) return frame;
    const o = maps[m[1]].originalPositionFor({ line: Number(m[2]), column: Number(m[3]) - 1 });
    return o.source ? `${o.source.replace(/^.*?(node_modules|src)\//, '$1/')}:${o.line}${o.name ? ' (' + o.name + ')' : ''}` : frame;
  };
}

// Wraps the scheduling APIs so every callback can be traced back to whoever registered it.
const INIT = () => {
  const counts = new Map();
  const site = () => {
    const lines = (new Error().stack || '').split('\n').slice(2);
    // First frame that is page code, not this wrapper.
    const first = lines.find((l) => l.includes('/assets/')) || lines[0] || '?';
    return first.trim().replace(/^at\s+/, '');
  };
  const wrap = (name) => {
    const orig = window[name].bind(window);
    window[name] = function (cb, ...rest) {
      const key = `${name} ${site()}`;
      counts.set(key, (counts.get(key) || 0) + 1);
      return orig(cb, ...rest);
    };
  };
  wrap('requestAnimationFrame');
  wrap('setInterval');
  wrap('setTimeout');
  const intervals = new Map();
  const origSI = window.setInterval;
  window.setInterval = function (cb, ms, ...rest) {
    const id = origSI(
      function () {
        const k = `interval(${ms}ms) ${key}`;
        intervals.set(k, (intervals.get(k) || 0) + 1);
        return typeof cb === 'function' ? cb.apply(this, arguments) : undefined;
      },
      ms,
      ...rest
    );
    const key = (new Error().stack || '').split('\n').slice(2).find((l) => l.includes('/assets/'))?.trim().replace(/^at\s+/, '') ?? '?';
    return id;
  };
  window.__sched = {
    reset() {
      counts.clear();
      intervals.clear();
    },
    read() {
      return { registrations: [...counts.entries()], intervalFires: [...intervals.entries()] };
    },
  };
};

async function snapshot(page, cdp) {
  await page.evaluate(() => window.__sched.reset());
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  await sleep(WINDOW_MS);
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const sched = await page.evaluate(() => window.__sched.read());
  const perSec = (k) => Math.round(((m1[k] - m0[k]) / (WINDOW_MS / 1000)) * (k.endsWith('Count') ? 1 : 1000) * 10) / 10;
  const mainThreadPerSecond = Object.fromEntries(
    ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'RecalcStyleCount', 'LayoutDuration', 'LayoutCount'].map((k) => [
      k.replace('Duration', 'Ms').replace('Count', 'Count'),
      perSec(k),
    ])
  );
  const anims = await page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const describe = (n) => {
      if (!n || n.nodeType !== 1) return String(n && n.nodeName);
      const t = n.tagName.toLowerCase();
      const cls = typeof n.className === 'string' ? n.className : n.getAttribute('class') || '';
      return t + (n.id ? '#' + n.id : '') + (cls.trim() ? '.' + cls.trim().split(/\s+/).slice(0, 3).join('.') : '');
    };
    return document.getAnimations().map((a) => {
      const target = a.effect && a.effect.target;
      const r = target && target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      const onScreen = !!r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
      const visible = target && target.checkVisibility ? target.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : null;
      const timing = a.effect ? a.effect.getComputedTiming() : {};
      return {
        type: a.constructor.name,
        name: a.animationName || a.transitionProperty || a.id || '(script)',
        playState: a.playState,
        infinite: timing.iterations === Infinity,
        section: target && target.closest ? (target.closest('section, nav, footer, header, [id]') || {}).id || null : null,
        target: describe(target),
        onScreen,
        visible,
      };
    });
  });
  const canvases = await page.evaluate(() =>
    [...document.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect();
      return {
        backing: [c.width, c.height],
        css: [Math.round(r.width), Math.round(r.height)],
        onScreen: r.bottom > 0 && r.top < window.innerHeight && r.width > 0,
        section: (c.closest('section') || {}).id || null,
      };
    })
  );
  const regs = sched.registrations
    .map(([k, n]) => {
      const [api, ...rest] = k.split(' ');
      const where = rest.join(' ');
      return { api, where: resolve ? resolve(where) : where, perSecond: Math.round((n / (WINDOW_MS / 1000)) * 10) / 10 };
    })
    .sort((a, b) => b.perSecond - a.perSecond);
  const intervalFires = sched.intervalFires.map(([k, n]) => ({ interval: resolve ? resolve(k) : k, perSecond: n / (WINDOW_MS / 1000) }));
  const summary = {};
  for (const a of anims.filter((x) => x.playState === 'running')) {
    const k = `${a.name}${a.infinite ? ' (infinite)' : ''} in #${a.section ?? '?'}`;
    const s = (summary[k] ??= { running: 0, onScreen: 0 });
    s.running++;
    if (a.onScreen) s.onScreen++;
  }
  return {
    mainThreadPerSecond,
    animations: { total: anims.length, running: anims.filter((a) => a.playState === 'running').length, runningOffScreen: anims.filter((a) => a.playState === 'running' && !a.onScreen).length, runningInfiniteOffScreen: anims.filter((a) => a.playState === 'running' && a.infinite && !a.onScreen).length, summary, list: anims },
    scheduling: regs,
    intervalFires,
    canvases,
  };
}

const browser = await chromium.launch({ channel: 'chromium' });
const result = { baseUrl, windowMs: WINDOW_MS, capturedAt: new Date().toISOString(), runs: {} };
for (const [name, ctx] of [
  ['desktop-1440', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ['mobile-375', { viewport: { width: 375, height: 812 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
]) {
  const context = await browser.newContext(ctx);
  await context.addInitScript(INIT);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await sleep(3000);
  const top = await snapshot(page, cdp);
  // Straight to Contact, then let the Experience snap and the entrances finish.
  await page.evaluate(() => {
    const c = document.getElementById('contact');
    window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY);
  });
  await sleep(3500);
  const contact = await snapshot(page, cdp);
  result.runs[name] = { top, contact };
  for (const [pos, s] of Object.entries({ top, contact })) {
    console.log(`\n== ${name} @ ${pos}: main thread/s ${JSON.stringify(s.mainThreadPerSecond)}`);
    console.log(`   animations: ${s.animations.running} running, ${s.animations.runningOffScreen} off screen (${s.animations.runningInfiniteOffScreen} infinite)`);
    for (const [k, v] of Object.entries(s.animations.summary)) console.log(`     ${String(v.running).padStart(3)} running, ${String(v.onScreen).padStart(3)} on screen  ${k}`);
    console.log('   scheduling (registrations/s):');
    for (const r of s.scheduling.slice(0, 12)) console.log(`     ${String(r.perSecond).padStart(6)}  ${r.api.padEnd(22)} ${r.where}`);
    for (const r of s.intervalFires) console.log(`     ${String(r.perSecond).padStart(6)}  fires ${r.interval}`);
    console.log('   canvases:', JSON.stringify(s.canvases));
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'offscreen.json'), JSON.stringify(result, null, 2));
