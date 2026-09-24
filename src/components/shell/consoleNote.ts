import buildInfo from 'virtual:build-info';
import { profile } from '../../content/profile';

let printed = false;

/** A short note for whoever opens the devtools console. Once per page load. */
export function printConsoleNote() {
  if (printed || typeof console === 'undefined') return;
  printed = true;
  const title = 'font: 700 16px/1.4 Archivo, sans-serif; color: #eef3fa; background: #0f2a4c; padding: 6px 10px;';
  const body = 'font: 13px/1.5 Archivo, sans-serif; color: #a9c1e0;';
  console.info(
    `%cDrawing set rev ${buildInfo.hash}%c\n` +
      `Hello, fellow engineer. This is React, TypeScript, Vite, Tailwind and Motion, prerendered at build time.\n` +
      `Source: ${profile.links.source.href}\n` +
      `Press Ctrl/⌘ K for commands. The cat on the cover is the checker; it has opinions about being clicked five times.\n` +
      `Say hello: ${profile.email}`,
    title,
    body,
  );
}
