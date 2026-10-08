import { describe, it, expect } from 'vitest';
import { computeParallaxOffset } from './parallax';

describe('computeParallaxOffset', () => {
  it('scales pointer position by the given factor', () => {
    expect(computeParallaxOffset({ x: 0.5, y: -0.5 }, 0.6)).toEqual({ x: 0.3, y: -0.3 });
  });

  it('clamps pointer values outside [-1, 1] before scaling', () => {
    expect(computeParallaxOffset({ x: 2, y: -2 }, 0.5)).toEqual({ x: 0.5, y: -0.5 });
  });

  it('defaults the factor to 0.6', () => {
    expect(computeParallaxOffset({ x: 1, y: 1 })).toEqual({ x: 0.6, y: 0.6 });
  });
});
