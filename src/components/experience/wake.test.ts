import { describe, it, expect } from 'vitest';
import {
  EMITTERS,
  advanceParticle,
  createParticle,
  emissionRate,
  particleAlpha,
  particleCap,
  type Emitter,
} from './wake';

const half = () => 0.5;

function emitterOfKind(kind: Emitter['kind'], curl?: number) {
  const found = EMITTERS.find((e) => e.kind === kind && (curl === undefined || e.curl === curl));
  if (!found) throw new Error(`no ${kind} emitter with curl ${curl}`);
  return found;
}

describe('emissionRate', () => {
  // The survey is the bulk of the section; nothing should be allocated or
  // drawn until the airframe actually starts moving.
  it('emits nothing while the airframe is on station', () => {
    expect(emissionRate(0)).toBe(0);
  });

  it('emits harder as the run accelerates', () => {
    expect(emissionRate(1)).toBeGreaterThan(emissionRate(0.4));
    expect(emissionRate(0.4)).toBeGreaterThan(0);
  });
});

describe('EMITTERS', () => {
  it('places every emitter inside the airframe plate', () => {
    expect(EMITTERS.length).toBeGreaterThan(0);
    EMITTERS.forEach((e) => {
      expect(e.x).toBeGreaterThan(0);
      expect(e.x).toBeLessThan(1);
      expect(e.y).toBeGreaterThan(0);
      expect(e.y).toBeLessThan(1);
    });
  });

  // A vortex pair that rolled the same way would read as a single smear
  // rather than as two counter-rotating tip vortices.
  it('carries a counter-rotating vortex pair and an exhaust source', () => {
    expect(EMITTERS.some((e) => e.kind === 'vortex' && e.curl > 0)).toBe(true);
    expect(EMITTERS.some((e) => e.kind === 'vortex' && e.curl < 0)).toBe(true);
    expect(EMITTERS.some((e) => e.kind === 'exhaust')).toBe(true);
  });
});

describe('createParticle', () => {
  // The plane travels left, so wake left behind it drifts aft (to the right)
  // in stage coordinates. This is what makes it read as a wake rather than
  // as ambient dust.
  it('trails exhaust aft of the departing airframe', () => {
    const p = createParticle(emitterOfKind('exhaust'), 100, 50, 900, half);
    expect(p.vx).toBeGreaterThan(0);
  });

  it('trails faster wake behind a faster airframe', () => {
    const slow = createParticle(emitterOfKind('exhaust'), 0, 0, 200, half);
    const fast = createParticle(emitterOfKind('exhaust'), 0, 0, 1200, half);
    expect(fast.vx).toBeGreaterThan(slow.vx);
  });

  it('rolls the two wingtip vortices in opposite directions', () => {
    const up = createParticle(emitterOfKind('vortex', 1), 0, 0, 900, half);
    const down = createParticle(emitterOfKind('vortex', -1), 0, 0, 900, half);
    expect(up.vy).toBeGreaterThan(0);
    expect(down.vy).toBeLessThan(0);
  });

  it('starts the particle at the emitter point it was released from', () => {
    const p = createParticle(emitterOfKind('exhaust'), 321, 87, 900, half);
    expect(p.x).toBe(321);
    expect(p.y).toBe(87);
  });
});

describe('advanceParticle', () => {
  it('carries the particle along its velocity', () => {
    const p = createParticle(emitterOfKind('exhaust'), 0, 0, 900, half);
    advanceParticle(p, 0.1);
    expect(p.x).toBeGreaterThan(0);
  });

  it('keeps a particle alive within its life', () => {
    const p = createParticle(emitterOfKind('exhaust'), 0, 0, 900, half);
    expect(advanceParticle(p, p.life / 4)).toBe(true);
  });

  it('retires a particle once it outlives its life', () => {
    const p = createParticle(emitterOfKind('exhaust'), 0, 0, 900, half);
    expect(advanceParticle(p, p.life + 0.01)).toBe(false);
  });

  // Wake slows as it dissipates; without drag the particles shoot off the
  // sheet in a straight line and read as tracer fire.
  it('drags the wake to a stop as it dissipates', () => {
    const p = createParticle(emitterOfKind('exhaust'), 0, 0, 900, half);
    const initial = p.vx;
    advanceParticle(p, 0.2);
    expect(p.vx).toBeLessThan(initial);
    expect(p.vx).toBeGreaterThan(0);
  });
});

describe('particleAlpha', () => {
  it('fades a particle out by the end of its life', () => {
    const p = createParticle(emitterOfKind('exhaust'), 0, 0, 900, half);
    p.age = p.life;
    expect(particleAlpha(p)).toBe(0);
  });

  it('peaks shortly after release, then decays', () => {
    const p = createParticle(emitterOfKind('exhaust'), 0, 0, 900, half);
    p.age = p.life * 0.1;
    const early = particleAlpha(p);
    p.age = p.life * 0.8;
    const late = particleAlpha(p);
    expect(early).toBeGreaterThan(late);
    expect(late).toBeGreaterThan(0);
  });
});

describe('particleCap', () => {
  it('budgets fewer particles on a phone than on a desktop', () => {
    expect(particleCap(390)).toBeLessThan(particleCap(1440));
    expect(particleCap(390)).toBeGreaterThan(0);
  });
});
