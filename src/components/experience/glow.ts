/**
 * The pool of light the airframe sits in, on the Experience stage.
 *
 * The geometry lives here as numbers rather than inline in a CSS string
 * because the one thing that matters about it is an arithmetic relationship
 * that is invisible by eye until it goes wrong: the falloff has to reach zero
 * *inside* the stage on every axis. The stage clips its children, so a ramp
 * that is still carrying alpha when it meets an edge is chopped off there, and
 * the step shows up as a seam down the side of the screen.
 *
 * The original gradient got this right vertically and wrong horizontally — a
 * 120%-wide ellipse whose transparent stop sat at 62% of the ray reached the
 * left and right edges at a third of full strength.
 */

// Centre, as a fraction of the stage. Slightly above the middle: it is lighting
// the airframe, which the fit() pass parks a little high.
const cx = 0.5;
const cy = 0.42;

// Ellipse radii, as fractions of the stage's width and height. Both are capped
// by the reach test below rather than chosen freely — see glowReach.
const rx = 0.52;
const ry = 0.43;

export const GLOW = {
  cx,
  cy,
  rx,
  ry,
  /** Accent blue, matching the section's other blueprint ink. */
  rgb: '47,106,212',
  /** [position along the ray, alpha]. Convex, so it settles onto zero. */
  stops: [
    [0, 0.17],
    [0.3, 0.115],
    [0.56, 0.06],
    [0.78, 0.012],
    [0.94, 0],
  ] as Array<[number, number]>,
};

/**
 * How far the glow actually reaches before it is fully transparent, as a
 * fraction of the stage's width and height. Both must come in under the
 * distance from the centre to the nearest edge on that axis, or the stage
 * clips a live ramp and leaves a visible seam.
 */
export function glowReach() {
  const last = GLOW.stops[GLOW.stops.length - 1][0];
  return { x: GLOW.rx * last, y: GLOW.ry * last };
}

export function glowGradient() {
  const stops = GLOW.stops.map(
    ([at, alpha]) => `rgba(${GLOW.rgb},${alpha}) ${(at * 100).toFixed(0)}%`
  ).join(', ');
  return `radial-gradient(${rx * 100}% ${ry * 100}% at ${cx * 100}% ${cy * 100}%, ${stops})`;
}
