import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  animateScrollTo,
  easeInOutCubic,
  scrollDuration,
  MIN_DURATION_MS,
  MAX_DURATION_MS,
} from './smoothScroll';

describe('easeInOutCubic', () => {
  it('is pinned at both ends', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('passes through the midpoint and stays monotonic', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = easeInOutCubic(t);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  it('starts slower than linear and ends faster (an ease, not a ramp)', () => {
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });
});

describe('scrollDuration', () => {
  it('clamps short and long journeys into the allowed range', () => {
    expect(scrollDuration(10)).toBe(MIN_DURATION_MS);
    expect(scrollDuration(100000)).toBe(MAX_DURATION_MS);
  });

  it('is direction-agnostic', () => {
    expect(scrollDuration(-1800)).toBe(scrollDuration(1800));
  });
});

describe('animateScrollTo', () => {
  let now = 0;
  let frames: FrameRequestCallback[] = [];

  beforeEach(() => {
    now = 0;
    frames = [];
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    window.scrollTo = vi.fn((_x: unknown, y?: number) => {
      Object.defineProperty(window, 'scrollY', { value: y ?? 0, configurable: true });
    }) as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 10000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Drive the rAF queue forward to a given timestamp.
  const advanceTo = (t: number) => {
    now = t;
    const due = frames;
    frames = [];
    due.forEach((cb) => cb(t));
  };

  it('lands exactly on the target', async () => {
    const anim = animateScrollTo(2000);
    advanceTo(2000); // well past the max duration
    await anim.finished;
    expect(window.scrollY).toBe(2000);
  });

  it('moves gradually rather than jumping straight there', () => {
    animateScrollTo(2000);
    advanceTo(scrollDuration(2000) / 2);
    expect(window.scrollY).toBeGreaterThan(0);
    expect(window.scrollY).toBeLessThan(2000);
  });

  it('clamps a target below the furthest the document can scroll', async () => {
    // maxScrollY here is 10000 - 800 = 9200
    const anim = animateScrollTo(9900);
    advanceTo(5000);
    await anim.finished;
    expect(window.scrollY).toBe(9200);
  });

  it('stops when the user grabs the scroll back', async () => {
    const anim = animateScrollTo(5000);
    advanceTo(100);
    const interrupted = window.scrollY;
    window.dispatchEvent(new Event('wheel'));
    advanceTo(5000);
    await anim.finished; // must resolve, not hang
    expect(window.scrollY).toBe(interrupted);
  });

  it('jumps instantly when the user prefers reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    const anim = animateScrollTo(2000);
    await anim.finished;
    expect(window.scrollY).toBe(2000);
    expect(frames).toHaveLength(0); // never animated

    window.matchMedia = original;
  });
});
