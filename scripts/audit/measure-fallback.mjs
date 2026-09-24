// Measures how wide text set in Archivo is compared with its local fallback
// (Arial / Arial Bold), per width and weight the site uses, so the fallback
// @font-face rules can be size-adjusted to wrap the same way before the web
// font arrives (no layout shift on the swap).
//
//   npm run build && node scripts/audit/measure-fallback.mjs
import { preview } from 'vite';
import { chromium } from 'playwright';

const server = await preview({ preview: { port: 5188, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  const result = await page.evaluate(async () => {
    await document.fonts.load('700 100px Archivo');
    await document.fonts.load('400 100px "B612 Mono"');
    const samples = {
      display: { stretch: '68%', weight: 700, text: ['Searan Kuganesan', 'Experience', 'Projects', 'Skills', 'Contact', 'CraftTraq'] },
      heading: { stretch: '85%', weight: 600, text: ['Component Tracker', 'Portfolio Risk Dashboard', 'Maintenance Scheduling Engine'] },
      body: {
        stretch: '100%',
        weight: 400,
        text: ['I build the systems operators run on: a component tracker supporting 2,000+ aircraft across 100+ operators'],
      },
    };
    const width = (family, stretch, weight, text) => {
      const e = document.createElement('span');
      Object.assign(e.style, { fontFamily: family, fontStretch: stretch, fontWeight: String(weight), fontSize: '100px', whiteSpace: 'nowrap', position: 'absolute' });
      e.textContent = text;
      document.body.append(e);
      const w = e.getBoundingClientRect().width;
      e.remove();
      return w;
    };
    const monoText = ['STA 1116', '01 of 05', '2026-09-24', 'c7f4d71 FIG. A NTS'];
    const mono = monoText.map((t) => width('"B612 Mono"', '100%', 400, t) / width('"Courier New"', '100%', 400, t));
    const monoRatio = (mono.reduce((a, b) => a + b, 0) / mono.length).toFixed(4);
    return Object.fromEntries(
      Object.entries(samples).map(([k, s]) => {
        const ratios = s.text.map((t) => width('Archivo', s.stretch, s.weight, t) / width('Arial', '100%', s.weight >= 600 ? 700 : 400, t));
        return [k, (ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(4)];
      }).concat([['mono vs Courier New', monoRatio]]),
    );
  });
  console.log(result);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
