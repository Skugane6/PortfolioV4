// Runtime smoothness for the performance audit.
//
//   node scripts/audit/perf-runtime.mjs [--url=http://127.0.0.1:4199/] [--profiles=desktop,mobile]
//        [--engine=gpu|swiftshader] [--rate=4] [--passes=metrics,trace,ablate] [--label=...]
//
// Per profile (desktop 1440x900 DPR1 mouse-wheel gestures; mobile 375x812 DPR3 touch gestures):
//   metrics: CPU throttled `rate`x after load. An injected rAF sampler, longtask, long-animation-frame
//            and layout-shift observers, and CDP Performance.getMetrics deltas per section:
//              hero-idle (3s, no input) -> hero (scroll to Experience) -> experience (whole pinned
//              section + departure, slow steady gesture) -> experience-settle (custom snap) ->
//              rest (to the bottom) -> contact-idle (3s).
//   trace:   same load/throttle, a Chrome trace of the Experience scroll only, saved gzipped.
//   ablate:  the Experience scroll again with CSS knocked out by an injected stylesheet (never the
//            source), a light trace each, to price individual effects on every thread.
// Scrolling is Input.synthesizeScrollGesture (real input on the compositor), so the page scrolls
// at the same speed however much the main thread is struggling, which is what a user sees.
// Output: docs/overhaul/audit/perf/runtime-<label>.json and trace-experience-<profile>-<label>.json.gz
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { analyseTrace } from './perf-trace.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  })
);
const URL = args.url ?? 'http://127.0.0.1:4199/';
const ENGINE = args.engine ?? 'gpu';
const RATE = Number(args.rate ?? 4);
const PROFILE_NAMES = String(args.profiles ?? 'desktop,mobile').split(',');
const PASSES = String(args.passes ?? 'metrics,trace,ablate').split(',');
const LABEL = args.label ?? `${ENGINE}-x${RATE}`;
const OUT = path.resolve('docs/overhaul/audit/perf');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROFILES = {
  desktop: {
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    gesture: 'mouse',
  },
  mobile: {
    context: {
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',
    },
    gesture: 'touch',
  },
};

// Scroll speeds, px/s. The Experience run is deliberately slow and steady.
const SPEED = { hero: 1000, experience: 500, rest: 1000 };

const TRACE_CATEGORIES_FULL = [
  '-*',
  'toplevel',
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'blink.user_timing',
  'latencyInfo',
  'cc',
  'gpu',
  'viz',
  'benchmark',
  'v8.execute',
];
const TRACE_CATEGORIES_LIGHT = [
  '-*',
  'toplevel',
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
];

// Injected before any page script runs.
const INIT = () => {
  const P = (window.__perf = { section: 'boot', frames: [], longtasks: [], loafs: [], shifts: [] });
  const describe = (n) => {
    if (!n || n.nodeType !== 1) return n ? n.nodeName : null;
    const parts = [];
    let el = n;
    for (let i = 0; el && el.nodeType === 1 && i < 4; i++, el = el.parentElement) {
      let s = el.tagName.toLowerCase();
      if (el.id) s += '#' + el.id;
      else if (typeof el.className === 'string' && el.className.trim()) s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
      parts.unshift(s);
      if (el.id) break;
    }
    return parts.join(' > ');
  };
  const rect = (r) => (r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null);
  let last = 0;
  const loop = (t) => {
    if (last) P.frames.push([Math.round(t * 10) / 10, Math.round((t - last) * 100) / 100, P.section, Math.round(window.scrollY)]);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) P.longtasks.push({ start: e.startTime, dur: e.duration, section: P.section });
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        P.loafs.push({
          start: e.startTime,
          dur: e.duration,
          blocking: e.blockingDuration,
          renderStart: e.renderStart,
          styleAndLayoutStart: e.styleAndLayoutStart,
          section: P.section,
          scripts: (e.scripts || []).map((s) => ({
            invoker: s.invoker,
            invokerType: s.invokerType,
            src: s.sourceURL,
            fn: s.sourceFunctionName,
            pos: s.sourceCharPosition,
            dur: s.duration,
            forced: s.forcedStyleAndLayoutDuration,
          })),
        });
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        P.shifts.push({
          t: e.startTime,
          value: e.value,
          hadRecentInput: e.hadRecentInput,
          section: P.section,
          sources: (e.sources || []).map((s) => ({ node: describe(s.node), prev: rect(s.previousRect), cur: rect(s.currentRect) })),
        });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
};

const pct = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
function frameStats(ds, vsync) {
  if (!ds.length) return { count: 0 };
  const share = (th) => Math.round((ds.filter((d) => d > th).length / ds.length) * 1000) / 10;
  const total = ds.reduce((a, b) => a + b, 0);
  return {
    count: ds.length,
    fps: Math.round((ds.length / total) * 10000) / 10,
    p50: pct(ds, 50),
    p95: pct(ds, 95),
    p99: pct(ds, 99),
    max: Math.max(...ds),
    over16_7: share(16.7),
    over33: share(33.4),
    over50: share(50),
    // At a >60Hz refresh the absolute thresholds are coarse: this is frames that missed the
    // display's own next vsync.
    missedVsync: vsync ? share(vsync * 1.5) : null,
  };
}

async function metricsOf(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
}
const METRIC_KEYS = ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration', 'RecalcStyleCount', 'LayoutCount', 'TaskOtherDuration'];

async function openPage(browser, prof, { css } = {}) {
  const context = await browser.newContext({ ...prof.context, reducedMotion: 'no-preference', serviceWorkers: 'block' });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  if (css) await page.addStyleTag({ content: css });
  await sleep(2500);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const geo = await page.evaluate(() => {
    const top = (id) => {
      const el = document.getElementById(id);
      return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
    };
    const exp = document.getElementById('experience');
    return {
      vh: window.innerHeight,
      vw: window.innerWidth,
      dpr: window.devicePixelRatio,
      expTop: top('experience'),
      expHeight: exp ? exp.offsetHeight : null,
      projTop: top('projects'),
      skillsTop: top('skills'),
      contactTop: top('contact'),
      docHeight: document.documentElement.scrollHeight,
    };
  });
  return { context, page, cdp, geo };
}

async function gestureTo(page, cdp, prof, geo, targetY, speed) {
  const from = await page.evaluate(() => window.scrollY);
  const dist = Math.round(targetY - from);
  if (Math.abs(dist) < 2) return;
  await cdp.send('Input.synthesizeScrollGesture', {
    x: Math.round(geo.vw / 2),
    y: Math.round(geo.vh * 0.55),
    yDistance: -dist,
    speed,
    gestureSourceType: prof.gesture,
    preventFling: true,
  });
}

async function setSection(page, name) {
  await page.evaluate((n) => (window.__perf.section = n), name);
}

async function refreshInterval(browser) {
  const page = await browser.newPage();
  await page.goto('about:blank');
  const d = await page.evaluate(
    () =>
      new Promise((res) => {
        const t = [];
        const f = (ts) => {
          t.push(ts);
          if (t.length < 121) requestAnimationFrame(f);
          else res(t.slice(1).map((x, i) => x - t[i]));
        };
        requestAnimationFrame(f);
      })
  );
  await page.close();
  return pct(d, 50);
}

async function runMetrics(browser, name, prof, vsync) {
  const { context, page, cdp, geo } = await openPage(browser, prof);
  const sections = {};
  const measure = async (sec, fn) => {
    await setSection(page, sec);
    const m0 = await metricsOf(cdp);
    const t0 = Date.now();
    await fn();
    const wall = Date.now() - t0;
    const m1 = await metricsOf(cdp);
    const d = Object.fromEntries(METRIC_KEYS.map((k) => [k, Math.round((m1[k] - m0[k]) * (k.endsWith('Count') ? 1 : 1000))]));
    sections[sec] = { wallMs: wall, mainThread: d, mainThreadBusyPct: Math.round((d.TaskDuration / wall) * 1000) / 10, scrollYEnd: await page.evaluate(() => Math.round(window.scrollY)) };
  };
  await measure('hero-idle', () => sleep(3000));
  await measure('hero', () => gestureTo(page, cdp, prof, geo, geo.expTop, SPEED.hero));
  await measure('experience', () => gestureTo(page, cdp, prof, geo, geo.projTop, SPEED.experience));
  await measure('experience-settle', () => sleep(1500));
  await measure('rest', () => gestureTo(page, cdp, prof, geo, geo.docHeight - geo.vh, SPEED.rest));
  await measure('contact-idle', () => sleep(3000));
  await setSection(page, 'done');
  const perf = await page.evaluate(() => window.__perf);
  for (const [sec, v] of Object.entries(sections)) {
    const ds = perf.frames.filter((f) => f[2] === sec).map((f) => f[1]);
    v.frames = frameStats(ds, vsync);
    v.longtasks = perf.longtasks.filter((l) => l.section === sec).length;
    v.longtaskMs = Math.round(perf.longtasks.filter((l) => l.section === sec).reduce((a, l) => a + l.dur, 0));
    v.loafs = perf.loafs.filter((l) => l.section === sec).length;
    v.layoutShift = Math.round(perf.shifts.filter((s) => s.section === sec && !s.hadRecentInput).reduce((a, s) => a + s.value, 0) * 10000) / 10000;
  }
  // Worst long animation frames with their scripts, for attribution.
  const loafs = perf.loafs
    .filter((l) => l.section !== 'boot')
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 15);
  // Script attribution summed across all LoAFs during scroll sections.
  const byScript = {};
  for (const l of perf.loafs.filter((x) => x.section !== 'boot'))
    for (const s of l.scripts) {
      const k = `${s.invokerType} ${s.invoker} @ ${String(s.src).replace(/^.*\/assets\//, '')}:${s.pos} ${s.fn || ''}`;
      const o = (byScript[k] ??= { count: 0, dur: 0, forced: 0 });
      o.count++;
      o.dur += s.dur;
      o.forced += s.forced;
    }
  const loafScripts = Object.entries(byScript)
    .map(([k, v]) => ({ script: k, count: v.count, totalMs: Math.round(v.dur), forcedLayoutMs: Math.round(v.forced) }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 20);
  const shifts = perf.shifts.filter((s) => s.value > 0.0005);
  // A per-frame timeline of the experience section, thinned, for plotting later.
  const expFrames = perf.frames.filter((f) => f[2] === 'experience' || f[2] === 'experience-settle');
  await context.close();
  return { geo, sections, loafs, loafScripts, shifts, bootLongtasks: perf.longtasks.filter((l) => l.section === 'boot'), expFrames };
}

async function tracedExperience(browser, name, prof, vsync, { css, categories, save }) {
  const { context, page, cdp, geo } = await openPage(browser, prof, { css });
  await gestureTo(page, cdp, prof, geo, geo.expTop, SPEED.hero);
  await sleep(800);
  await setSection(page, 'experience');
  const f0 = await page.evaluate(() => window.__perf.frames.length);
  const m0 = await metricsOf(cdp);
  await browser.startTracing(page, { categories, screenshots: false });
  const t0 = Date.now();
  await gestureTo(page, cdp, prof, geo, geo.projTop, SPEED.experience);
  const wall = Date.now() - t0;
  const buf = await browser.stopTracing();
  const m1 = await metricsOf(cdp);
  await setSection(page, 'done');
  const ds = await page.evaluate((from) => window.__perf.frames.slice(from).filter((f) => f[2] === 'experience').map((f) => f[1]), f0);
  await context.close();
  const trace = JSON.parse(buf.toString('utf8'));
  let savedAs = null;
  if (save) {
    savedAs = path.join(OUT, save);
    fs.writeFileSync(savedAs, zlib.gzipSync(buf, { level: 9 }));
  }
  const mainThread = Object.fromEntries(METRIC_KEYS.map((k) => [k, Math.round((m1[k] - m0[k]) * (k.endsWith('Count') ? 1 : 1000))]));
  return {
    wallMs: wall,
    frames: frameStats(ds, vsync),
    mainThread,
    trace: analyseTrace(trace),
    savedAs: savedAs ? path.relative(process.cwd(), savedAs) : null,
    rawTraceMB: Math.round((buf.length / 1048576) * 10) / 10,
  };
}

// Each knocks one family of effects out of #experience (and only there) via an injected sheet.
const ABLATIONS = {
  baseline: '',
  'no-hud-filters': '#experience * { filter: none !important; }',
  'no-blend-mode': '#experience * { mix-blend-mode: normal !important; }',
  'no-wake-canvas': '#experience canvas { display: none !important; }',
  'no-clip-path': '#experience * { clip-path: none !important; }',
  'all-effects-off':
    '#experience * { filter: none !important; mix-blend-mode: normal !important; clip-path: none !important; box-shadow: none !important; } #experience canvas { display: none !important; }',
};

const launchOpts =
  ENGINE === 'gpu'
    ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
    : {}; // default Playwright headless shell: SwiftShader software GL, 60Hz
const browser = await chromium.launch(launchOpts);
const vsync = await refreshInterval(browser);
const gpu = await (async () => {
  const p = await browser.newPage();
  const r = await p.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
  });
  await p.close();
  return r;
})();
const outPath = path.join(OUT, `runtime-${LABEL}.json`);
const result = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : {};
Object.assign(result, { url: URL, engine: ENGINE, gpuRenderer: gpu, browserVersion: browser.version(), cpuThrottle: RATE, refreshIntervalMs: vsync, speeds: SPEED, capturedAt: new Date().toISOString() });
result.profiles ??= {};
console.log(`engine ${ENGINE} (${gpu}), refresh interval ${vsync} ms, CPU x${RATE}`);

for (const name of PROFILE_NAMES) {
  const prof = PROFILES[name];
  const r = (result.profiles[name] ??= {});
  if (PASSES.includes('metrics')) {
    r.metrics = await runMetrics(browser, name, prof, vsync);
    console.log(`\n== ${name} metrics`);
    for (const [sec, v] of Object.entries(r.metrics.sections))
      console.log(`  ${sec.padEnd(18)} ${JSON.stringify(v.frames)} busy ${v.mainThreadBusyPct}% style ${v.mainThread.RecalcStyleDuration}ms/${v.mainThread.RecalcStyleCount} layout ${v.mainThread.LayoutDuration}ms/${v.mainThread.LayoutCount} script ${v.mainThread.ScriptDuration}ms LT ${v.longtasks} LoAF ${v.loafs} CLS ${v.layoutShift} y=${v.scrollYEnd}`);
  }
  if (PASSES.includes('trace')) {
    r.trace = await tracedExperience(browser, name, prof, vsync, {
      categories: TRACE_CATEGORIES_FULL,
      save: `trace-experience-${name}-${LABEL}.json.gz`,
    });
    console.log(`\n== ${name} trace: ${r.trace.rawTraceMB} MB raw -> ${r.trace.savedAs}; frames ${JSON.stringify(r.trace.frames)}`);
  }
  if (PASSES.includes('ablate')) {
    r.ablations = {};
    for (const [abl, css] of Object.entries(ABLATIONS)) {
      const a = await tracedExperience(browser, name, prof, vsync, { css, categories: TRACE_CATEGORIES_LIGHT });
      delete a.trace.topFunctions;
      r.ablations[abl] = a;
      console.log(`  ablation ${name}/${abl.padEnd(16)} frames ${JSON.stringify(a.frames)} threads ${JSON.stringify(a.trace.threadBusyMs)}`);
    }
  }
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
}
await browser.close();
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`\nwrote ${path.relative(process.cwd(), outPath)}`);
