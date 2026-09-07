import { describe, it, expect } from 'vitest';
import { wideStagePoints, stackedStagePoints, nearestStage, pickSnapTarget } from './snap';
import { SURVEY_END } from './departure';

// Mirrors Experience's actual reveal schedule, so these tests catch the
// schedule and the snap points drifting apart, not just the math in
// isolation.
const WIDE_STARTS = [0.08, 0.26, 0.44, 0.62];
const WIDE_SPAN = 0.18;
const STACKED_WINDOWS: Array<[number, number, number, number]> = [
  [0.1, 0.18, 0.28, 0.33],
  [0.34, 0.42, 0.52, 0.57],
  [0.58, 0.66, 0.76, 0.81],
  [0.82, 0.9, 1.01, 1.02],
];

describe('wideStagePoints', () => {
  it('starts at the datum and settles where each callout finishes revealing', () => {
    expect(wideStagePoints(WIDE_STARTS, WIDE_SPAN)).toEqual([0, 0.26, 0.44, 0.62, 0.8]);
  });

  it('lands its last stage exactly at SURVEY_END, matching the tuned schedule', () => {
    const stages = wideStagePoints(WIDE_STARTS, WIDE_SPAN);
    expect(stages[stages.length - 1]).toBeCloseTo(SURVEY_END, 6);
  });
});

describe('stackedStagePoints', () => {
  it('starts at the datum and settles at the middle of each hold window', () => {
    const stages = stackedStagePoints(STACKED_WINDOWS, SURVEY_END);
    expect(stages[0]).toBe(0);
    expect(stages[1]).toBeCloseTo(0.23 * SURVEY_END, 6);
    expect(stages[2]).toBeCloseTo(0.47 * SURVEY_END, 6);
    expect(stages[3]).toBeCloseTo(0.71 * SURVEY_END, 6);
    expect(stages[4]).toBeCloseTo(0.955 * SURVEY_END, 6);
  });

  it('keeps every stage within the survey', () => {
    for (const stage of stackedStagePoints(STACKED_WINDOWS, SURVEY_END)) {
      expect(stage).toBeLessThanOrEqual(SURVEY_END);
    }
  });
});

describe('nearestStage', () => {
  const stages = [0, 0.26, 0.44, 0.62, 0.8];

  it('picks the closest stage on either side', () => {
    expect(nearestStage(0.05, stages)).toBe(0);
    expect(nearestStage(0.3, stages)).toBe(0.26);
    expect(nearestStage(0.5, stages)).toBe(0.44);
    expect(nearestStage(0.79, stages)).toBe(0.8);
  });

  it('breaks an exact tie toward the earlier stage', () => {
    expect(nearestStage(0.35, stages)).toBe(0.26);
  });

  it('returns the only stage when given just one', () => {
    expect(nearestStage(0.9, [0.5])).toBe(0.5);
  });
});

describe('pickSnapTarget', () => {
  const stages = [0, 0.26, 0.44, 0.62, 0.8];

  // Always resolves to one stage or the other — the earlier "hold, undecided"
  // branch was itself the bug: it let a slow scroll rest indefinitely at a
  // partial reveal instead of committing anywhere (see Experience's apply).
  it('never returns null', () => {
    for (const p of [0, 0.02, 0.13, 0.24, 0.5, 0.8]) {
      expect(pickSnapTarget(p, stages, 1)).not.toBeNull();
      expect(pickSnapTarget(p, stages, -1)).not.toBeNull();
    }
  });

  // The commit fraction is small on purpose: a real forward scroll — even a
  // short one — should commit to the next stage almost immediately, not
  // require crossing most of the gap first.
  it('commits to the next stage down after a small but real scroll', () => {
    expect(pickSnapTarget(0.06, stages, 1)).toBe(0.26); // 0.06/0.26 ≈ 0.23 > 0.18
  });

  it('commits back to the stage just left only when the scroll is barely more than noise', () => {
    expect(pickSnapTarget(0.02, stages, 1)).toBe(0); // 0.02/0.26 ≈ 0.08 < 0.18
  });

  it('mirrors the same rule scrolling up', () => {
    expect(pickSnapTarget(0.1, stages, -1)).toBe(0); // real upward travel commits back
    expect(pickSnapTarget(0.24, stages, -1)).toBe(0.26); // barely off 0.26, stays there
  });

  it('falls back to plain nearest-neighbour when no direction is known', () => {
    expect(pickSnapTarget(0.05, stages, 0)).toBe(0);
    expect(pickSnapTarget(0.35, stages, 0)).toBe(0.26);
  });

  it('settles immediately when already on or past every remaining stage', () => {
    expect(pickSnapTarget(0.8, stages, 1)).toBe(0.8);
    expect(pickSnapTarget(0, stages, -1)).toBe(0);
  });
});
