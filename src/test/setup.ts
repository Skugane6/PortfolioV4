import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Without vitest's `globals: true`, @testing-library/react's automatic
// afterEach(cleanup) never registers, so DOM from one test leaks into the
// next within the same file. Register it explicitly, once, for every test.
afterEach(cleanup);

class DefaultIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!('IntersectionObserver' in globalThis)) {
  // jsdom has no runtime IntersectionObserver (the DOM lib types declare it, but nothing
  // implements it here) — this is a minimal test-env stub.
  globalThis.IntersectionObserver = DefaultIntersectionObserver;
}

class DefaultResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  // jsdom has no runtime ResizeObserver either — same rationale as the
  // IntersectionObserver stub above.
  globalThis.ResizeObserver = DefaultResizeObserver;
}

if (!window.matchMedia) {
  // jsdom has no matchMedia; framer-motion's useReducedMotion calls it (and so does
  // Hero's own reduced-motion check for the panel parallax). Default to "no preference"
  // so components render their normal (non-reduced) branch in tests unless a specific
  // test overrides window.matchMedia itself.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
