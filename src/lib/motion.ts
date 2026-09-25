import { useSyncExternalStore } from 'react';

/**
 * Motion tokens (DESIGN.md §4.5) that script-driven animation uses, in the
 * units Motion takes (seconds). The full set, including the CSS-only ones,
 * lives in src/design/tokens.css.
 */
export const dur = { quick: 0.16, base: 0.24, plot: 0.9 } as const;

export const ease = {
  /** A plotter pen: accelerates, then settles onto the line's end. */
  pen: [0.65, 0, 0.35, 1],
} as const;

export const spring = {
  ui: { type: 'spring', stiffness: 420, damping: 34 },
} as const;

/*
 * Reduced motion has two sources: the OS preference, and the visitor's own
 * toggle in the command palette, which writes data-motion on <html> (and
 * localStorage, read back by the inline script in index.html before paint so
 * CSS and JS agree from the first frame). The attribute wins when present.
 */
const QUERY = '(prefers-reduced-motion: reduce)';

function readReduced(): boolean {
  if (typeof window === 'undefined') return false;
  const attr = document.documentElement.dataset.motion;
  if (attr === 'reduce') return true;
  if (attr === 'full') return false;
  return window.matchMedia?.(QUERY).matches ?? false;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const mq = typeof window !== 'undefined' ? window.matchMedia?.(QUERY) : undefined;
  mq?.addEventListener?.('change', listener);
  return () => {
    listeners.delete(listener);
    mq?.removeEventListener?.('change', listener);
  };
}

/** True when motion should be reduced. Server snapshot: false (full motion markup is never emitted server-side anyway; see prerender). */
export function useReducedMotionPref(): boolean {
  return useSyncExternalStore(subscribe, readReduced, () => false);
}

export function setMotionPreference(value: 'reduce' | 'full' | 'system') {
  const root = document.documentElement;
  if (value === 'system') delete root.dataset.motion;
  else root.dataset.motion = value;
  try {
    if (value === 'system') localStorage.removeItem('motion');
    else localStorage.setItem('motion', value);
  } catch {
    // Private mode or blocked storage: the preference lasts for this page view.
  }
  listeners.forEach((l) => l());
}
