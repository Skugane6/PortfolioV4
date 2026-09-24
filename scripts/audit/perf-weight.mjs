// Page-weight inventory for the performance audit.
//
//   node scripts/audit/perf-weight.mjs [baseUrl=http://127.0.0.1:4199/] [label=local]
//
// For 1440x900 (desktop) and 375x812 (mobile emulation, DPR 3): every request
// seen over CDP with resource type, protocol, transfer (encodedDataLength) and
// decoded size, split into phases:
//   load   - everything up to the load event
//   idle   - after load until the network has been quiet (the lazy oneko chunk lands here)
//   scroll - anything a slow scroll to the bottom pulls in (lazy images)
// Plus every <img> with natural vs displayed size and whether it carries
// width/height attributes, and CSS background images.
// Output: docs/overhaul/audit/perf/weight-<label>.json
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [, , baseUrl = 'http://127.0.0.1:4199/', label = 'local'] = process.argv;
const OUT = path.resolve('docs/overhaul/audit/perf');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: 'desktop-1440', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  {
    name: 'mobile-375',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
];

// Map a gstatic font URL to family/style/weight/subset using the Google Fonts CSS the page itself received.
function parseFontCss(css) {
  const map = {};
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
  let m;
  while ((m = re.exec(css))) {
    const body = m[2];
    const fam = /font-family:\s*'([^']+)'/.exec(body)?.[1];
    const style = /font-style:\s*(\w+)/.exec(body)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const url = /url\(([^)]+)\)/.exec(body)?.[1];
    // Variable fonts serve several declared weights from one file: keep them all.
    if (url) {
      const prev = map[url];
      map[url] = prev ? { ...prev, weight: `${prev.weight},${weight}` } : { family: fam, style, weight, subset: m[1] };
    }
  }
  return map;
}

const browser = await chromium.launch();
const result = { baseUrl, label, capturedAt: new Date().toISOString(), runs: [] };

for (const vp of VIEWPORTS) {
  const { name, ...ctxOpts } = vp;
  const context = await browser.newContext({ ...ctxOpts, serviceWorkers: 'block' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  const reqs = new Map();
  let phase = 'load';
  cdp.on('Network.requestWillBeSent', (e) => {
    if (reqs.has(e.requestId)) return; // redirects keep the id
    reqs.set(e.requestId, {
      url: e.request.url,
      method: e.request.method,
      type: e.type,
      initiator: e.initiator?.type,
      phase,
      start: e.timestamp,
      decoded: 0,
    });
  });
  cdp.on('Network.responseReceived', (e) => {
    const r = reqs.get(e.requestId);
    if (!r) return;
    Object.assign(r, {
      status: e.response.status,
      mime: e.response.mimeType,
      protocol: e.response.protocol,
      encoding: e.response.headers['content-encoding'] ?? e.response.headers['Content-Encoding'] ?? null,
      cacheControl: e.response.headers['cache-control'] ?? e.response.headers['Cache-Control'] ?? null,
      fromCache: e.response.fromDiskCache || e.response.fromMemoryCache || false,
      type: e.type ?? r.type,
    });
  });
  cdp.on('Network.dataReceived', (e) => {
    const r = reqs.get(e.requestId);
    if (r) r.decoded += e.dataLength;
  });
  cdp.on('Network.loadingFinished', (e) => {
    const r = reqs.get(e.requestId);
    if (r) {
      r.transfer = e.encodedDataLength;
      r.end = e.timestamp;
    }
  });
  cdp.on('Network.loadingFailed', (e) => {
    const r = reqs.get(e.requestId);
    if (r) r.failed = e.errorText;
  });

  let fontCss = '';
  page.on('response', async (res) => {
    if (res.url().startsWith('https://fonts.googleapis.com/css')) fontCss = await res.text().catch(() => '');
  });

  const t0 = Date.now();
  await page.goto(baseUrl, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd };
  });
  phase = 'idle';
  await page.waitForLoadState('networkidle');
  await sleep(3000);
  phase = 'scroll';
  // Slow scroll to the bottom so lazy images and whileInView entrances fire.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= total; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(120);
  }
  await page.waitForLoadState('networkidle');
  await sleep(1500);

  // Images: natural vs displayed. Measured at the bottom of the page for lazy ones; the
  // displayed box does not depend on scroll position except for transformed ones.
  const images = await page.evaluate(() => {
    const dpr = window.devicePixelRatio;
    return [...document.images].map((img) => {
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      return {
        src: img.currentSrc || img.src,
        alt: img.alt,
        natural: [img.naturalWidth, img.naturalHeight],
        layout: [img.offsetWidth, img.offsetHeight],
        rendered: [Math.round(r.width), Math.round(r.height)],
        dpr,
        neededPx: [Math.round(img.offsetWidth * dpr), Math.round(img.offsetHeight * dpr)],
        attrWidth: img.getAttribute('width'),
        attrHeight: img.getAttribute('height'),
        cssAspect: cs.aspectRatio,
        loading: img.getAttribute('loading'),
        decoding: img.getAttribute('decoding'),
        fetchpriority: img.getAttribute('fetchpriority'),
        inPicture: img.parentElement?.tagName === 'PICTURE',
        visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0,
      };
    });
  });
  const bgImages = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg.includes('url(')) out.push({ tag: el.tagName, cls: String(el.className).slice(0, 80), bg: bg.slice(0, 160) });
    }
    return out;
  });

  const fontMap = parseFontCss(fontCss);
  const firstStart = Math.min(...[...reqs.values()].map((r) => r.start));
  const requests = [...reqs.values()].map((r) => {
    const out = { ...r, startMs: Math.round((r.start - firstStart) * 1000), durationMs: r.end && r.start ? Math.round((r.end - r.start) * 1000) : null };
    delete out.start;
    delete out.end;
    if (fontMap[r.url]) out.font = fontMap[r.url];
    return out;
  });

  const sum = (xs, k) => xs.reduce((a, r) => a + (r[k] ?? 0), 0);
  const group = (pred) => {
    const xs = requests.filter(pred);
    return { count: xs.length, transfer: sum(xs, 'transfer'), decoded: sum(xs, 'decoded') };
  };
  const totals = {
    all: group(() => true),
    atLoad: group((r) => r.phase === 'load'),
    byType: {},
    // By initiator, not phase: a dynamic import() fired at mount still lands before the load event.
    jsInitial: group((r) => r.type === 'Script' && r.initiator === 'parser'),
    jsLazy: group((r) => r.type === 'Script' && r.initiator !== 'parser'),
    jsBeforeLoadEvent: group((r) => r.type === 'Script' && r.phase === 'load'),
    fontsByFace: {},
  };
  for (const t of new Set(requests.map((r) => r.type))) totals.byType[t] = group((r) => r.type === t);
  for (const r of requests.filter((x) => x.font)) {
    const k = `${r.font.family} ${r.font.style} ${r.font.weight} (${r.font.subset})`;
    totals.fontsByFace[k] = { transfer: r.transfer, decoded: r.decoded, phase: r.phase };
  }

  result.runs.push({ name, ...vp, loadMs, nav, totals, requests, images, bgImages, fontFacesDeclared: Object.keys(fontMap).length });
  console.log(`\n== ${label} ${name}: ${requests.length} requests, ${(totals.all.transfer / 1024).toFixed(1)} KB transfer / ${(totals.all.decoded / 1024).toFixed(1)} KB decoded; load event ${Math.round(nav.load)} ms`);
  for (const [t, v] of Object.entries(totals.byType))
    console.log(`  ${t.padEnd(12)} ${String(v.count).padStart(3)}  ${(v.transfer / 1024).toFixed(1).padStart(8)} KB  ${(v.decoded / 1024).toFixed(1).padStart(8)} KB`);
  console.log(`  JS initial ${(totals.jsInitial.transfer / 1024).toFixed(1)} KB, JS lazy ${(totals.jsLazy.transfer / 1024).toFixed(1)} KB`);
  for (const r of requests)
    console.log(`   ${r.phase.padEnd(6)} ${String(r.initiator).padEnd(7)} ${String(r.type).padEnd(10)} ${String(r.protocol).padEnd(8)} ${String(r.encoding).padEnd(5)} ${((r.transfer ?? 0) / 1024).toFixed(1).padStart(7)} / ${((r.decoded ?? 0) / 1024).toFixed(1).padStart(7)} KB  @${String(r.startMs).padStart(5)}ms +${String(r.durationMs).padStart(5)}ms  ${r.url.slice(0, 90)}${r.font ? `  [${r.font.family} ${r.font.style} ${r.font.weight} ${r.font.subset}]` : ''}`);
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, `weight-${label}.json`), JSON.stringify(result, null, 2));
