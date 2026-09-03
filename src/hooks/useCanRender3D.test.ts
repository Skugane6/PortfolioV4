import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeCanRender3D } from './useCanRender3D';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('computeCanRender3D', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
  });

  it('returns true on a wide viewport with no reduced-motion preference', () => {
    expect(computeCanRender3D()).toBe(true);
  });

  it('returns false when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    expect(computeCanRender3D()).toBe(false);
  });

  it('returns false on a narrow (mobile) viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    expect(computeCanRender3D()).toBe(false);
  });
});
