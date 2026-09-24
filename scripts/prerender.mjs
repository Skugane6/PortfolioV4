// Renders the app to static HTML at build time and injects it into
// dist/index.html, so the first paint needs no JavaScript (the h1 is the LCP
// element). Run after `vite build` and `vite build --ssr`; see package.json.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const { render } = await import(pathToFileURL(ssrEntry).href);
const html = render();

const indexPath = path.join(dist, 'index.html');
let page = await fs.readFile(indexPath, 'utf8');
if (!page.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill');
page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

// Inline the stylesheet: it is small (about 8 KB compressed) and render-
// blocking, so shipping it in the document saves a round trip before the
// first paint on a slow connection.
const cssLink = page.match(/<link rel="stylesheet"[^>]*href="\/assets\/([^"]+\.css)"[^>]*>/);
if (cssLink) {
  const css = await fs.readFile(path.join(dist, 'assets', cssLink[1]), 'utf8');
  page = page.replace(cssLink[0], `<style>${css}</style>`);
}
// Start the app after the first frame has painted. The prerendered page is
// complete without it (every link works), so on a slow connection the
// fonts and images get the bandwidth first and the scripts follow.
const entry = page.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/);
if (!entry) throw new Error('no module entry script found in dist/index.html');
page = page.replace(
  entry[0],
  `<script>(function(){function go(){var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src='${entry[1]}';document.head.appendChild(s)}function start(){requestAnimationFrame(function(){requestAnimationFrame(go)})}if(document.readyState==='complete')start();else addEventListener('load',start,{once:true})})()</script>`,
);
await fs.writeFile(indexPath, page);
await fs.rm(path.join(root, 'dist-ssr'), { recursive: true, force: true });

console.log(`prerendered ${(html.length / 1024).toFixed(1)} KB of HTML into dist/index.html`);
