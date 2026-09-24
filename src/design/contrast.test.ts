import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';
import { palette, textTokens } from './palette';

describe('palette', () => {
  it.each(textTokens)('%s clears 4.5:1 on the cyanotype ground', (token) => {
    expect(contrastRatio(palette[token], palette.cyanotype)).toBeGreaterThanOrEqual(4.5);
  });

  it('construction lines clear 3:1 for non-text graphics', () => {
    expect(contrastRatio(palette.construction, palette.cyanotype)).toBeGreaterThanOrEqual(3);
  });

  it('the ground reads as text on the two markup fills (redline button, checker highlight)', () => {
    expect(contrastRatio(palette.cyanotype, palette.redline)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.cyanotype, palette.checker)).toBeGreaterThanOrEqual(4.5);
  });
});
