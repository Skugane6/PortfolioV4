// Animated scrolling for the nav rail. Native `scroll-behavior: smooth` was the
// obvious alternative, but it gives no control over duration or easing (and
// Safari's curve is noticeably abrupt), and there is no reliable "it finished"
// signal to hang the rail's highlight lock off. So: a small rAF tween.

export const MIN_DURATION_MS = 500;
export const MAX_DURATION_MS = 1000;

// Ease in, ease out, symmetric. Slow departure and a long settle at the end
// read as "travelling" rather than "cut" — the whole point of the exercise.
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Longer journeys get more time, but sub-linearly and hard-capped: a full
// hero -> contact trip must not feel like it is dawdling.
export function scrollDuration(distance: number): number {
  const scaled = Math.abs(distance) * 0.4;
  return Math.max(MIN_DURATION_MS, Math.min(MAX_DURATION_MS, scaled));
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

export function maxScrollY(): number {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

export interface ScrollAnimation {
  cancel: () => void;
  finished: Promise<void>;
}

/**
 * Tween the window to `targetY`. Resolves when it arrives, or as soon as the
 * user takes the scroll back — a tween that fights the wheel is worse than no
 * tween at all, so any wheel/touch/key input cancels it immediately.
 */
export function animateScrollTo(targetY: number): ScrollAnimation {
  const startY = window.scrollY;
  // Clamp: the last section starts below the furthest the document can scroll,
  // so an unclamped target would leave the tween chasing a value it can never
  // reach and never resolving.
  const endY = Math.max(0, Math.min(targetY, maxScrollY()));
  const distance = endY - startY;

  let cancelled = false;
  let frame = 0;
  let resolveFinished: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const stopEvents = ['wheel', 'touchstart', 'keydown'] as const;
  const teardown = () => {
    stopEvents.forEach((type) => window.removeEventListener(type, cancel));
  };

  function cancel() {
    if (cancelled) return;
    cancelled = true;
    if (frame) cancelAnimationFrame(frame);
    teardown();
    resolveFinished();
  }

  if (distance === 0 || prefersReducedMotion()) {
    window.scrollTo(0, endY);
    resolveFinished!();
    return { cancel, finished };
  }

  const duration = scrollDuration(distance);
  const startTime = performance.now();

  const step = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * easeInOutCubic(t));
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      teardown();
      resolveFinished();
    }
  };

  stopEvents.forEach((type) => window.addEventListener(type, cancel, { passive: true }));
  frame = requestAnimationFrame(step);

  return { cancel, finished };
}
