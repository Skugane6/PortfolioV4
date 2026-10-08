import { describe, it, expect } from 'vitest';
import { GLOW, glowGradient, glowReach } from './glow';

describe('glowReach', () => {
  // The bug this exists to prevent: the glow used a 120%-wide ellipse whose
  // transparent stop landed at only 41% of the way to the left/right edges, so
  // the wash was still at a third of full strength when the stage clipped it.
  // That hard step is visible as a vertical seam down each side of the screen.
  it('fades to nothing before the left and right edges of the stage', () => {
    expect(glowReach().x).toBeLessThan(Math.min(GLOW.cx, 1 - GLOW.cx));
  });

  it('fades to nothing before the top and bottom edges of the stage', () => {
    expect(glowReach().y).toBeLessThan(Math.min(GLOW.cy, 1 - GLOW.cy));
  });

  // The seam is only invisible if the falloff arrives at zero gently. A ramp
  // that is still descending steeply when it hits its last stop terminates in
  // a faint ring, which is the same artefact one edge further out.
  it('lands on zero with a softening tail rather than a steep cut', () => {
    const s = GLOW.stops;
    const slope = (i: number) => (s[i][1] - s[i + 1][1]) / (s[i + 1][0] - s[i][0]);
    const last = slope(s.length - 2);
    const steepest = Math.max(...s.slice(0, -1).map((_, i) => slope(i)));
    expect(last).toBeLessThan(steepest / 2);
  });

  it('fades monotonically outward', () => {
    GLOW.stops.forEach(([, alpha], i) => {
      if (i > 0) expect(alpha).toBeLessThan(GLOW.stops[i - 1][1]);
    });
    expect(GLOW.stops[GLOW.stops.length - 1][1]).toBe(0);
  });
});

describe('glowGradient', () => {
  // `transparent` is transparent *black*, so a ramp ending there desaturates
  // through grey on its way out and reads as grubby rather than as light
  // falling off. Every stop has to carry the glow's own colour.
  it('never interpolates through transparent black', () => {
    expect(glowGradient()).not.toContain('transparent');
    const stops = glowGradient().match(/rgba\([^)]*\)/g) ?? [];
    expect(stops.length).toBe(GLOW.stops.length);
    stops.forEach((stop) => expect(stop).toContain(GLOW.rgb));
  });

  it('renders a radial gradient positioned on the airframe', () => {
    expect(glowGradient()).toContain(`at ${GLOW.cx * 100}% ${GLOW.cy * 100}%`);
  });
});
