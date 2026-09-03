import { describe, it, expect } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#0a0a0c', '#0a0a0c')).toBeCloseTo(1, 5);
  });

  it('returns 21 for pure black against pure white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('meets WCAG AA (>=4.5) for accent-text on the void background', () => {
    expect(contrastRatio('#ffb27a', '#0a0a0c')).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA (>=4.5) for primary ink on the void background', () => {
    expect(contrastRatio('#f5f4f0', '#0a0a0c')).toBeGreaterThanOrEqual(4.5);
  });
});
