import { describe, it, expect } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#f7f8fa', '#f7f8fa')).toBeCloseTo(1, 5);
  });

  it('returns 21 for pure black against pure white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  // The site is dark-only, and these are the actual tokens from index.css.
  describe('the site palette', () => {
    it('meets WCAG AA (>=4.5) for ink on the page background', () => {
      expect(contrastRatio('#e7ecf3', '#0a0d13')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>=4.5) for muted ink-dim text on the page background', () => {
      expect(contrastRatio('#8b94a3', '#0a0d13')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>=4.5) for accent text/links on the page background', () => {
      // Deliberately brighter than the raw accent fill (#2f6ad4, which falls
      // short here): this is the token text/links actually use.
      expect(contrastRatio('#5b8ff0', '#0a0d13')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>=4.5) for white button text on the accent fill', () => {
      expect(contrastRatio('#ffffff', '#2f6ad4')).toBeGreaterThanOrEqual(4.5);
    });
  });
});
