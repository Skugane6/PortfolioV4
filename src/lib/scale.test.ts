import { describe, expect, it } from 'vitest';
import { drawingScale } from './scale';

describe('drawingScale', () => {
  it('reports 1:N where N is real length over drawn length, in CSS inches', () => {
    // 1100 CSS px is 1100/96 in = 0.2910 m drawn; 32.51 m / 0.2910 m ≈ 111.7
    expect(drawingScale(1100, 32.51)).toBe(112);
  });

  it('rounds to a whole denominator and never reports below 1', () => {
    expect(drawingScale(1e7, 32.51)).toBe(1);
  });
});
