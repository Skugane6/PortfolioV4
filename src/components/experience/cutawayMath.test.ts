import { describe, it, expect } from 'vitest';
import { clamp, smoothstep, computeCutawayValues, phaseLabel, progressFromRect } from './cutawayMath';

describe('clamp', () => {
  it('clamps below the minimum', () => {
    expect(clamp(-0.5)).toBe(0);
  });

  it('clamps above the maximum', () => {
    expect(clamp(1.5)).toBe(1);
  });

  it('passes through in-range values', () => {
    expect(clamp(0.42)).toBe(0.42);
  });
});

describe('smoothstep', () => {
  it('maps 0 to 0 and 1 to 1', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
  });

  it('maps the midpoint to 0.5', () => {
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 5);
  });
});

describe('computeCutawayValues', () => {
  it('is fully closed at p=0 in scroll mode', () => {
    const values = computeCutawayValues(0, 'scroll');
    expect(values).toEqual({ p: 0, pi: 0, po: 0, pr: 0 });
  });

  it('finishes the intro fade by p=0.13 in scroll mode', () => {
    expect(computeCutawayValues(0.13, 'scroll').pi).toBeCloseTo(1, 5);
  });

  it('fully opens the bay by p=0.55 in scroll mode', () => {
    expect(computeCutawayValues(0.55, 'scroll').po).toBeCloseTo(1, 5);
  });

  it('fully reveals content by p=0.76 in scroll mode', () => {
    expect(computeCutawayValues(0.76, 'scroll').pr).toBeCloseTo(1, 5);
  });

  it('is intro-visible immediately in tap and static modes, regardless of p', () => {
    expect(computeCutawayValues(0, 'tap').pi).toBe(1);
    expect(computeCutawayValues(0, 'static').pi).toBe(1);
  });

  it('clamps an out-of-range raw progress value', () => {
    expect(computeCutawayValues(-1, 'scroll').p).toBe(0);
    expect(computeCutawayValues(2, 'scroll').p).toBe(1);
  });
});

describe('phaseLabel', () => {
  it('reads HULL CLOSED below 0.12', () => {
    expect(phaseLabel(0)).toBe('HULL CLOSED');
    expect(phaseLabel(0.11)).toBe('HULL CLOSED');
  });

  it('reads LATCHES RELEASED between 0.12 and 0.3', () => {
    expect(phaseLabel(0.12)).toBe('LATCHES RELEASED');
    expect(phaseLabel(0.29)).toBe('LATCHES RELEASED');
  });

  it('reads CROWN LIFT · BELLY DROP between 0.3 and 0.55', () => {
    expect(phaseLabel(0.3)).toBe('CROWN LIFT · BELLY DROP');
    expect(phaseLabel(0.54)).toBe('CROWN LIFT · BELLY DROP');
  });

  it('reads BAY 02 EXPOSED between 0.55 and 0.9', () => {
    expect(phaseLabel(0.55)).toBe('BAY 02 EXPOSED');
    expect(phaseLabel(0.89)).toBe('BAY 02 EXPOSED');
  });

  it('reads SEQUENCE COMPLETE at 0.9 and above', () => {
    expect(phaseLabel(0.9)).toBe('SEQUENCE COMPLETE');
    expect(phaseLabel(1)).toBe('SEQUENCE COMPLETE');
  });
});

describe('progressFromRect', () => {
  it('is 0 when the section top is at the viewport top', () => {
    expect(progressFromRect(0, 1000, 800)).toBe(0);
  });

  it('is 1 when the section has scrolled fully past', () => {
    expect(progressFromRect(-200, 1000, 800)).toBe(1);
  });

  it('is 0 when the section is shorter than the viewport (no scroll span)', () => {
    expect(progressFromRect(0, 500, 800)).toBe(0);
  });
});
