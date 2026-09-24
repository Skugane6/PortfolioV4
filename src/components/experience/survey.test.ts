import { describe, expect, it } from 'vitest';
import { dockParts, surveyPhases } from './survey';

describe('surveyPhases', () => {
  it('starts with nothing docked and nothing stamped', () => {
    const s = surveyPhases(0, 4);
    expect(s.docks).toEqual([0, 0, 0, 0]);
    expect(s.stamp).toBe(0);
    expect(s.percent).toBe(0);
  });

  it('ends complete: every callout docked, the stamp down, the readout at 100', () => {
    const s = surveyPhases(1, 4);
    expect(s.docks).toEqual([1, 1, 1, 1]);
    expect(s.stamp).toBe(1);
    expect(s.percent).toBe(100);
  });

  it('docks fore to aft: a callout never leads the one before it', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const { docks } = surveyPhases(p, 4);
      for (let i = 1; i < docks.length; i++) expect(docks[i]).toBeLessThanOrEqual(docks[i - 1]);
    }
  });

  it('reaches 100% only once every callout has docked', () => {
    for (let p = 0; p <= 1; p += 0.005) {
      const s = surveyPhases(p, 4);
      if (s.percent === 100) expect(Math.min(...s.docks)).toBe(1);
    }
  });

  it('works for any number of callouts', () => {
    expect(surveyPhases(1, 1).docks).toEqual([1]);
    expect(surveyPhases(1, 7).docks).toHaveLength(7);
  });
});

describe('dockParts', () => {
  it('draws the leader before the card appears', () => {
    const early = dockParts(0.3);
    expect(early.leaderDown).toBe(1);
    expect(early.card).toBe(0);
    const done = dockParts(1);
    expect(done).toEqual({ leaderDown: 1, leaderAcross: 1, leaderIn: 1, card: 1 });
  });
});
