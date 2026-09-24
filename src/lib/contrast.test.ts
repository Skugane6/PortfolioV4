import { describe, it, expect } from 'vitest';
import { contrastRatio, hexToRgb } from './contrast';

describe('contrastRatio', () => {
  it('returns 1 for identical colours', () => {
    expect(contrastRatio('#f7f8fa', '#f7f8fa')).toBeCloseTo(1, 5);
  });

  it('returns 21 for pure black against pure white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0f2a4c', '#a9c1e0')).toBeCloseTo(contrastRatio('#a9c1e0', '#0f2a4c'), 10);
  });
});

describe('hexToRgb', () => {
  it('parses six-digit hex with or without the hash', () => {
    expect(hexToRgb('#0f2a4c')).toEqual([15, 42, 76]);
    expect(hexToRgb('ffd23f')).toEqual([255, 210, 63]);
  });
});
