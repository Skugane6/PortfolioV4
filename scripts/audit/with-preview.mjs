// Serves dist/ with vite preview for the lifetime of one command, replacing
// the literal {url} in its arguments with the preview URL, then shuts down.
//
//   node scripts/audit/with-preview.mjs node scripts/audit/capture.mjs {url} docs/overhaul/screenshots/after
import { preview } from 'vite';
import { spawn } from 'node:child_process';

const [cmd, ...args] = process.argv.slice(2);
const server = await preview({ preview: { port: 4199, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
const url = server.resolvedUrls.local[0];
const child = spawn(cmd, args.map((a) => a.replaceAll('{url}', url)), { stdio: 'inherit', shell: process.platform === 'win32' });
const code = await new Promise((r) => child.on('exit', r));
await new Promise((r) => server.httpServer.close(r));
process.exit(code ?? 1);
