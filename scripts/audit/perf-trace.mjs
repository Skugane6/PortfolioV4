// Chrome trace analysis for the performance audit.
//
//   node scripts/audit/perf-trace.mjs <trace.json[.gz]> [--sm=<dir with sourcemapped build>]
//
// Also imported by perf-runtime.mjs (analyseTrace). Reports, for the page's renderer main thread:
// self time by event name and by group (script / style / layout / paint+composite / gc / other),
// style-recalc volume (elements per UpdateLayoutTree), layout volume, paint counts, per-frame
// averages; busy time for every other thread that matters (compositor, raster workers, GPU, Viz);
// and the heaviest JS entry points (FunctionCall), mapped to source when --sm is given.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const GROUPS = {
  script: /^(FunctionCall|EvaluateScript|v8\.|V8\.|FireAnimationFrame|TimerFire|EventDispatch|RunMicrotasks|RunTask$|v8\.callFunction|v8\.run|ParseAuthorStyleSheet$|XHRReadyStateChange|FireIdleCallback|ResizeObserver|IntersectionObserver|HitTest)/,
  gc: /(GC|Gc|BlinkGC|MinorGC|MajorGC|CppGC)/,
  style: /^(UpdateLayoutTree|RecalculateStyles|ScheduleStyleRecalculation|InvalidateLayout|StyleInvalidatorInvalidationTracking)$/,
  layout: /^(Layout|UpdateLayout|ComputeIntersections|IntersectionObserverController::computeIntersections)$/,
  paint: /^(Paint|PaintImage|PrePaint|Layerize|UpdateLayer|UpdateLayerTree|Commit|CompositeLayers|PaintSetup|RasterTask|Decode Image|ImageDecodeTask|Draw LazyPixelRef|Decode LazyPixelRef|UpdateLayerTree|LocalFrameView::RunPrePaintLifecyclePhase|LocalFrameView::RunPaintLifecyclePhase|LocalFrameView::UpdateAllLifecyclePhases|ProxyMain::BeginMainFrame::commit)$/,
};
const groupOf = (name) => {
  if (GROUPS.gc.test(name)) return 'gc';
  for (const g of ['style', 'layout', 'paint', 'script']) if (GROUPS[g].test(name)) return g;
  return 'other';
};

function events(trace) {
  return Array.isArray(trace) ? trace : trace.traceEvents ?? [];
}

// Pairs B/E into X and returns per-thread arrays sorted by ts.
function byThread(evts) {
  const threads = new Map();
  const open = new Map();
  for (const e of evts) {
    if (e.ph !== 'X' && e.ph !== 'B' && e.ph !== 'E') continue;
    const key = `${e.pid}:${e.tid}`;
    if (e.ph === 'B') {
      const st = open.get(key) ?? [];
      st.push(e);
      open.set(key, st);
      continue;
    }
    let ev = e;
    if (e.ph === 'E') {
      const st = open.get(key);
      const b = st?.pop();
      if (!b) continue;
      ev = { ...b, ph: 'X', dur: e.ts - b.ts, args: { ...b.args, ...e.args } };
    }
    if (typeof ev.dur !== 'number') continue;
    if (!threads.has(key)) threads.set(key, []);
    threads.get(key).push(ev);
  }
  for (const arr of threads.values()) arr.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
  return threads;
}

// Self time per event name, and top-level (depth 0) busy time.
function selfTimes(list) {
  const self = {};
  const count = {};
  let busy = 0;
  const stack = [];
  const finalize = (n) => {
    self[n.name] = (self[n.name] ?? 0) + Math.max(0, n.dur - n.child);
  };
  for (const e of list) {
    while (stack.length && stack[stack.length - 1].end <= e.ts) finalize(stack.pop());
    const parent = stack[stack.length - 1];
    const end = e.ts + e.dur;
    // Children that overrun their parent (sloppy nesting) are clamped to it.
    if (parent) parent.child += Math.min(end, parent.end) - e.ts;
    else busy += e.dur;
    count[e.name] = (count[e.name] ?? 0) + 1;
    stack.push({ name: e.name, end, dur: e.dur, child: 0 });
  }
  while (stack.length) finalize(stack.pop());
  return { self, count, busy };
}

let smCache = null;
async function resolver(smDir) {
  if (!smDir) return null;
  if (smCache) return smCache;
  const { SourceMapConsumer } = await import('source-map-js');
  const assets = path.join(smDir, 'assets');
  const maps = {};
  for (const f of fs.readdirSync(assets).filter((x) => x.endsWith('.js.map'))) {
    maps[f.split('-')[0]] = new SourceMapConsumer(JSON.parse(fs.readFileSync(path.join(assets, f), 'utf8')));
  }
  smCache = (url, line, col) => {
    const chunk = String(url).split('/').pop().split('-')[0];
    const m = maps[chunk];
    if (!m) return null;
    const o = m.originalPositionFor({ line, column: Math.max(0, col) });
    return o.source ? `${o.source.replace(/^.*?(node_modules|src)\//, '$1/')}:${o.line}${o.name ? ' ' + o.name : ''}` : null;
  };
  return smCache;
}

export function analyseTrace(trace, { resolve } = {}) {
  const evts = events(trace);
  const threadName = new Map();
  const procName = new Map();
  for (const e of evts) {
    if (e.ph !== 'M') continue;
    if (e.name === 'thread_name') threadName.set(`${e.pid}:${e.tid}`, e.args?.name);
    if (e.name === 'process_name') procName.set(e.pid, e.args?.name);
  }
  const threads = byThread(evts);

  // The page's renderer main thread: the CrRendererMain with the most frame work.
  let mainKey = null;
  let best = -1;
  for (const [key, list] of threads) {
    if (threadName.get(key) !== 'CrRendererMain') continue;
    const n = list.filter((e) => e.name === 'UpdateLayoutTree' || e.name === 'FireAnimationFrame' || e.name === 'Paint').length;
    if (n > best) {
      best = n;
      mainKey = key;
    }
  }
  if (!mainKey) return { error: 'no renderer main thread found' };
  const main = threads.get(mainKey);
  const mainPid = Number(mainKey.split(':')[0]);
  const t0 = main[0].ts;
  const t1 = Math.max(...main.map((e) => e.ts + e.dur));
  const windowMs = (t1 - t0) / 1000;

  const { self, count, busy } = selfTimes(main);
  const groups = { script: 0, style: 0, layout: 0, paint: 0, gc: 0, other: 0 };
  for (const [name, us] of Object.entries(self)) groups[groupOf(name)] += us;
  const ms = (us) => Math.round(us / 100) / 10;

  const frames = count['BeginMainThreadFrame'] ?? count['BeginFrame'] ?? null;
  const styleEv = main.filter((e) => e.name === 'UpdateLayoutTree');
  const elementCounts = styleEv.map((e) => e.args?.elementCount ?? e.args?.data?.elementCount ?? 0);
  const layoutEv = main.filter((e) => e.name === 'Layout');
  const paintEv = main.filter((e) => e.name === 'Paint');
  const rafEv = main.filter((e) => e.name === 'FireAnimationFrame');

  // Heaviest JS entry points, inclusive.
  const fnAgg = {};
  for (const e of main) {
    if (e.name !== 'FunctionCall') continue;
    const d = e.args?.data ?? {};
    const url = d.url ?? '';
    const line = d.lineNumber ?? 0;
    const col = d.columnNumber ?? 0;
    const src = resolve ? resolve(url, line, col - 1) : null;
    const key = `${d.functionName || '(anonymous)'} @ ${url.replace(/^.*\/assets\//, '')}:${line}:${col}${src ? ' -> ' + src : ''}`;
    const o = (fnAgg[key] ??= { calls: 0, us: 0 });
    o.calls++;
    o.us += e.dur;
  }
  const topFunctions = Object.entries(fnAgg)
    .map(([k, v]) => ({ fn: k, calls: v.calls, totalMs: ms(v.us) }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 20);

  // Busy time on the other threads that carry rendering work, within the same window.
  const threadBusy = {};
  for (const [key, list] of threads) {
    const pid = Number(key.split(':')[0]);
    const tn = threadName.get(key) ?? 'unknown';
    const pn = procName.get(pid) ?? 'unknown';
    const inWin = list.filter((e) => e.ts >= t0 && e.ts <= t1);
    if (!inWin.length) continue;
    const relevant =
      (pid === mainPid && /CrRendererMain|Compositor|CompositorTileWorker|ThreadPool/.test(tn)) ||
      /GPU/i.test(pn) ||
      /VizCompositor|CrGpuMain/.test(tn);
    if (!relevant) continue;
    const label = `${pn === 'Renderer' || pid === mainPid ? 'renderer' : pn}:${tn.replace(/\d+$/, '').replace(/[/]$/, '')}`;
    const { busy: b } = selfTimes(inWin);
    threadBusy[label] = (threadBusy[label] ?? 0) + b;
  }
  const threadBusyMs = Object.fromEntries(
    Object.entries(threadBusy)
      .map(([k, v]) => [k, ms(v)])
      .filter(([, v]) => v > 1)
      .sort((a, b) => b[1] - a[1])
  );

  const raster = [...threads.values()].flat().filter((e) => e.name === 'RasterTask' && e.ts >= t0 && e.ts <= t1);
  const top = Object.entries(self)
    .map(([name, us]) => ({ name, selfMs: ms(us), count: count[name], group: groupOf(name) }))
    .sort((a, b) => b.selfMs - a.selfMs)
    .slice(0, 25);

  return {
    windowMs: Math.round(windowMs),
    mainThread: {
      busyMs: ms(busy),
      busyPct: Math.round((busy / 1000 / windowMs) * 1000) / 10,
      groupsMs: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, ms(v)])),
      mainFrames: frames,
      perMainFrameMs: frames ? Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, Math.round((v / 1000 / frames) * 100) / 100])) : null,
      rafCallbacks: rafEv.length,
      rafMs: ms(rafEv.reduce((a, e) => a + e.dur, 0)),
      styleRecalcs: styleEv.length,
      styleMs: ms(styleEv.reduce((a, e) => a + e.dur, 0)),
      styleElementsAvg: styleEv.length ? Math.round(elementCounts.reduce((a, b) => a + b, 0) / styleEv.length) : null,
      styleElementsMax: styleEv.length ? Math.max(...elementCounts) : null,
      layouts: layoutEv.length,
      layoutMs: ms(layoutEv.reduce((a, e) => a + e.dur, 0)),
      layoutDirtyAvg: layoutEv.length
        ? Math.round(layoutEv.reduce((a, e) => a + (e.args?.beginData?.dirtyObjects ?? 0), 0) / layoutEv.length)
        : null,
      paints: paintEv.length,
      paintMs: ms(paintEv.reduce((a, e) => a + e.dur, 0)),
      topSelf: top,
    },
    rasterTasks: raster.length,
    rasterMs: ms(raster.reduce((a, e) => a + e.dur, 0)),
    threadBusyMs,
    topFunctions,
  };
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  const sm = process.argv.find((a) => a.startsWith('--sm='))?.slice(5);
  let buf = fs.readFileSync(file);
  if (file.endsWith('.gz')) buf = zlib.gunzipSync(buf);
  const trace = JSON.parse(buf.toString('utf8'));
  const resolve = await resolver(sm);
  const r = analyseTrace(trace, { resolve });
  console.log(JSON.stringify(r, null, 2));
}
