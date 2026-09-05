import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeCutawayMode } from './useCutawayMode';

function mockMatchMedia({ reduced = false, coarse = false }: { reduced?: boolean; coarse?: boolean }) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduced-motion') ? reduced : query.includes('pointer: coarse') ? coarse : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('computeCutawayMode', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
  });

  it('returns static when the user prefers reduced motion', () => {
    mockMatchMedia({ reduced: true });
    expect(computeCutawayMode()).toBe('static');
  });

  it('returns tap on a coarse pointer even at a wide viewport', () => {
    mockMatchMedia({ coarse: true });
    expect(computeCutawayMode()).toBe('tap');
  });

  it('returns tap on a narrow viewport even with a fine pointer', () => {
    mockMatchMedia({});
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    expect(computeCutawayMode()).toBe('tap');
  });

  it('returns scroll on a wide viewport with a fine pointer and no reduced-motion preference', () => {
    mockMatchMedia({});
    expect(computeCutawayMode()).toBe('scroll');
  });

  it('prefers static over tap when both reduced-motion and coarse pointer are set', () => {
    mockMatchMedia({ reduced: true, coarse: true });
    expect(computeCutawayMode()).toBe('static');
  });
});
