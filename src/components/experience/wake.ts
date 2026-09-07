/**
 * Particle maths for the departure wake — the wingtip vortices and engine
 * exhaust the airframe leaves behind as it runs off the left of the sheet.
 *
 * Kept free of canvas and DOM so the behaviour that matters (where wake goes,
 * how long it lives, how much of it there is) is testable on its own.
 *
 * Coordinates are stage pixels. The airframe travels left, so wake released
 * into the stage is left behind and drifts *aft* — to the right — relative to
 * the aircraft.
 */

export type WakeKind = 'vortex' | 'exhaust';

export interface Emitter {
  /** Position on the airframe plate, as a fraction of its width/height. */
  x: number;
  y: number;
  kind: WakeKind;
  /** Roll direction of a tip vortex: +1 down-and-in, -1 up-and-in, 0 for exhaust. */
  curl: number;
}

/**
 * Wake sources on the CRJ side elevation. The drawing has the nose at the left
 * (see the flight-direction arrow on the sheet), so these run bow to stern:
 * the wing trailing edge around the middle, the aft-fuselage nacelle behind
 * it, and the T-tail stabiliser tip at the very top of the fin.
 *
 * Tuned against the rendered plate rather than the source art — the image is
 * an x-ray with a lot of transparent margin, so nominal airframe stations do
 * not land where the ink is.
 */
export const EMITTERS: Emitter[] = [
  // Winglet tip, and its trailing edge just below. Sweep and dihedral put the
  // tip high and well aft of the wing root in a side elevation — nowhere near
  // the 46% "main wing" station the sheet's own notes call out, which is the
  // fuselage frame the wing box attaches to. The pair counter-rotates, which
  // is what a tip vortex sheet actually does and stops the two reading as one
  // smear.
  { x: 0.645, y: 0.657, kind: 'vortex', curl: -1 },
  { x: 0.632, y: 0.697, kind: 'vortex', curl: 1 },
  // Exhaust nozzle on the aft-fuselage nacelle — the CRJ is rear-engined, so
  // this is well behind the wing and high on the fuselage. Two points across
  // the nozzle annulus rather than one, which both fills the plume and weights
  // emission toward the engine, where most of the wake belongs.
  { x: 0.826, y: 0.558, kind: 'exhaust', curl: 0 },
  { x: 0.83, y: 0.588, kind: 'exhaust', curl: 0 },
  // Horizontal stabiliser tip, at the very top of the T-tail.
  { x: 0.972, y: 0.065, kind: 'vortex', curl: -1 },
];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds since release. */
  age: number;
  /** Seconds until it has fully dissipated. */
  life: number;
  size: number;
  curl: number;
  kind: WakeKind;
}

// Particles per second at full departure speed. The takeoff run is under a
// second of scrolling, and lifetimes are around a second, so in practice the
// budget in particleCap is what is on screen — this rate just has to reach it
// quickly enough that the plume is dense from the first frame.
const PEAK_RATE = 420;

// How much of the airframe's own speed the wake keeps once released, in the
// stage's frame. Jet exhaust leaves the nozzle faster than the aircraft is
// travelling, so it genuinely moves aft in world terms; a tip vortex is left
// hanging in the air and barely translates at all — it rolls instead (see
// CURL_ACCEL).
const EXHAUST_CARRY = 0.5;
const VORTEX_CARRY = 0.34;

// Wake decelerates as it dissipates, per second.
const DRAG = 1.4;
// How hard a tip vortex keeps rolling after release, px/s². Has to stay well
// under the aft drift above, or the roll dominates and the vortices read as
// vertical sparks falling off the wing rather than as a trailing curl.
const CURL_ACCEL = 95;
// Fraction of a particle's life spent fading in.
const ATTACK = 0.12;

export function emissionRate(run: number): number {
  return Math.max(0, Math.min(1, run)) * PEAK_RATE;
}

/**
 * Releases one particle from `emitter` at the stage point (`x`, `y`), given
 * the airframe's current speed in px/s. `rand` is injected so the spread is
 * deterministic under test.
 */
export function createParticle(
  emitter: Emitter,
  x: number,
  y: number,
  speed: number,
  rand: () => number = Math.random
): Particle {
  const vortex = emitter.kind === 'vortex';
  const carry = vortex ? VORTEX_CARRY : EXHAUST_CARRY;
  return {
    x,
    y,
    vx: speed * carry * (0.7 + rand() * 0.6),
    // A vortex leaves with its roll already established; exhaust just spreads.
    vy: vortex ? emitter.curl * (26 + rand() * 30) : (rand() - 0.5) * 34,
    age: 0,
    life: vortex ? 1 + rand() * 0.65 : 0.55 + rand() * 0.45,
    size: vortex ? 1.2 + rand() * 1.4 : 1.6 + rand() * 2,
    curl: emitter.curl,
    kind: emitter.kind,
  };
}

/** Advances a particle by `dt` seconds. Returns false once it has expired. */
export function advanceParticle(p: Particle, dt: number): boolean {
  p.age += dt;
  if (p.curl !== 0) p.vy += p.curl * CURL_ACCEL * dt;
  const drag = Math.exp(-DRAG * dt);
  p.vx *= drag;
  p.vy *= drag;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  return p.age < p.life;
}

/** Opacity for a particle: a fast attack, then a soft quadratic decay. */
export function particleAlpha(p: Particle): number {
  const t = p.age / p.life;
  if (t <= 0 || t >= 1) return 0;
  if (t < ATTACK) return t / ATTACK;
  const decay = 1 - (t - ATTACK) / (1 - ATTACK);
  return decay * decay;
}

/**
 * Particle budget for a viewport. A phone is both slower and showing a much
 * smaller airframe, so it gets a smaller field rather than the same one
 * crammed into less space.
 */
export function particleCap(viewportWidth: number): number {
  if (viewportWidth < 768) return 90;
  if (viewportWidth < 1280) return 160;
  return 240;
}
