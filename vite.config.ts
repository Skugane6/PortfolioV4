/// <reference types="vitest" />
import { execSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

interface Revision {
  hash: string;
  date: string;
  subject: string;
}

/**
 * `virtual:build-info`: the last three commits and the build's own hash, read
 * from git at build time. Vercel clones with history, so this works there;
 * without git it falls back to Vercel's commit env var, then to "dev".
 */
function buildInfo(): Plugin {
  const id = 'virtual:build-info';
  const resolved = '\0' + id;
  const read = () => {
    let revisions: Revision[] = [];
    try {
      const out = execSync('git log -3 --format=%h%x1f%cI%x1f%s', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      revisions = out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [hash, date, subject] = line.split('\x1f');
          return { hash, date: date.slice(0, 10), subject };
        });
    } catch {
      revisions = [];
    }
    const envSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
    const hash = revisions[0]?.hash ?? envSha ?? 'dev';
    const date = revisions[0]?.date ?? new Date().toISOString().slice(0, 10);
    return { hash, date, revisions };
  };
  return {
    name: 'build-info',
    resolveId: (source) => (source === id ? resolved : null),
    load: (source) => (source === resolved ? `export default ${JSON.stringify(read())};` : null),
  };
}

export default defineConfig({
  plugins: [react(), buildInfo()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
