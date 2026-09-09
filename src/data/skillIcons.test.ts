import { describe, it, expect } from 'vitest';
import { skillMarks } from './skillIcons';

// The plate the marks sit on (see the Skills gradient in Skills.tsx).
const PLATE_BG = '#12161f';

const relativeLuminance = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + [0.2126, 0.7152, 0.0722][i] * v, 0);

const contrast = (a: string, b: string) => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('skill marks', () => {
  it('paints every mark with currentColor so the section can tint it', () => {
    Object.entries(skillMarks).forEach(([slug, mark]) => {
      expect(mark.body, slug).toContain('currentColor');
      expect(mark.body, slug).not.toMatch(/fill="#/);
    });
  });

  it('gives every mark a viewBox', () => {
    Object.entries(skillMarks).forEach(([slug, mark]) => {
      expect(mark.viewBox, slug).toMatch(/^0 0 \d+ \d+$/);
    });
  });

  it('clears 3:1 against the plate, per WCAG 1.4.11 for non-text graphics', () => {
    // pandas (#150458) and NumPy (#013243) are why the generator lifts colours
    // at all: at their official hex they are all but invisible here.
    Object.entries(skillMarks).forEach(([slug, mark]) => {
      expect(mark.hex, slug).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrast(mark.hex, PLATE_BG), slug).toBeGreaterThanOrEqual(3);
    });
  });

  it('leaves a brand hex alone when it already reads on the dark plate', () => {
    // React's official #61DAFB needs no help; only the marks that fail the
    // check above should ever differ from what their owner publishes.
    expect(skillMarks.react.hex).toBe('#61DAFB');
    expect(skillMarks.stripe.hex).toBe('#635BFF');
    expect(skillMarks.pandas.hex).not.toBe('#150458');
  });
});
