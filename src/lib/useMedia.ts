import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * False during the server render and during hydration, true after. Lets a
 * component emit the static, fully readable version of itself into the
 * prerendered HTML and switch to its animated version only once running.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** A media query as state. `serverValue` is what the prerendered HTML assumes. */
export function useMedia(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
