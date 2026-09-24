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
const template = await fs.readFile(indexPath, 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill');
await fs.writeFile(indexPath, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`));
await fs.rm(path.join(root, 'dist-ssr'), { recursive: true, force: true });

console.log(`prerendered ${(html.length / 1024).toFixed(1)} KB of HTML into dist/index.html`);
