import { describe, it, expect } from 'vitest';
import { departurePhases, sectionProgress, progressToScrolled, SURVEY_END, CLEAR_END } from './departure';

describe('sectionProgress', () => {
  const pinned = 3300;
  const depart = 400;

  it('runs the survey over the pinned travel', () => {
    expect(sectionProgress(0, pinned, depart)).toBe(0);
    expect(sectionProgress(pinned / 2, pinned, depart)).toBeCloseTo(CLEAR_END / 2, 6);
  });

  // Both the survey and the clear-out belong to the pin, so the sheet is
  // already empty at the instant the stage lets go, so there is no pinned tail
  // where the callouts are done and nothing is happening yet.
  it('empties the sheet exactly as the section unpins', () => {
    expect(sectionProgress(pinned, pinned, depart)).toBeCloseTo(CLEAR_END, 6);
    expect(departurePhases(sectionProgress(pinned, pinned, depart)).clear).toBeCloseTo(1, 6);
  });

  it('finishes the survey before the clear-out, while still pinned', () => {
    const atSurveyEnd = pinned * (SURVEY_END / CLEAR_END);
    expect(atSurveyEnd).toBeLessThan(pinned);
    expect(sectionProgress(atSurveyEnd, pinned, depart)).toBeCloseTo(SURVEY_END, 6);
  });

  // The run is measured against scroll *past* the release, which is the same
  // scroll that lifts the stage away and brings Projects up. That is what
  // makes the aircraft leave while the page is already moving on.
  it('spends the takeoff run on scroll past the release', () => {
    expect(departurePhases(sectionProgress(pinned + depart / 2, pinned, depart)).run).toBeGreaterThan(0);
    expect(sectionProgress(pinned + depart, pinned, depart)).toBeCloseTo(1, 6);
  });

  it('clamps above and below the section', () => {
    expect(sectionProgress(-800, pinned, depart)).toBe(0);
    expect(sectionProgress(pinned + depart * 3, pinned, depart)).toBe(1);
  });
});

describe('progressToScrolled', () => {
  const pinned = 3300;
  const depart = 400;

  it('inverts sectionProgress across the whole section, pin and departure both', () => {
    for (const scrolled of [0, pinned * 0.2, pinned * 0.5, pinned * 0.8, pinned, pinned + depart * 0.5, pinned + depart]) {
      const p = sectionProgress(scrolled, pinned, depart);
      expect(progressToScrolled(p, pinned, depart)).toBeCloseTo(scrolled, 6);
    }
  });

  it('resolves a progress at the very end of the pin to exactly the pinned travel', () => {
    expect(progressToScrolled(CLEAR_END, pinned, depart)).toBeCloseTo(pinned, 6);
  });

  it('resolves full progress to the end of the takeoff run, past the pin', () => {
    expect(progressToScrolled(1, pinned, depart)).toBeCloseTo(pinned + depart, 6);
  });

  it('clamps a progress past 1 to the end of the run', () => {
    expect(progressToScrolled(1.4, pinned, depart)).toBeCloseTo(pinned + depart, 6);
  });

  it('clamps a negative progress to the start of the pin', () => {
    expect(progressToScrolled(-0.2, pinned, depart)).toBe(0);
  });
});

describe('departurePhases', () => {
  // The whole point of remapping: every tuned constant in Experience (the
  // callout windows, the annotation fade) keeps its current meaning because
  // the survey still finishes at a survey progress of exactly 1.
  it('completes the survey at SURVEY_END rather than at the end of the section', () => {
    expect(departurePhases(SURVEY_END).survey).toBeCloseTo(1, 6);
    expect(departurePhases(SURVEY_END / 2).survey).toBeCloseTo(0.5, 6);
  });

  it('holds the survey at 1 through the departure', () => {
    expect(departurePhases(CLEAR_END).survey).toBe(1);
    expect(departurePhases(1).survey).toBe(1);
  });

  it('keeps the sheet clear-out dormant until the survey is over', () => {
    expect(departurePhases(0.5).clear).toBe(0);
    expect(departurePhases(SURVEY_END).clear).toBe(0);
  });

  it('finishes clearing the sheet before the takeoff run starts', () => {
    expect(departurePhases(CLEAR_END).clear).toBe(1);
  });

  it('keeps the airframe on station until the sheet is clear', () => {
    expect(departurePhases(0.5).run).toBe(0);
    expect(departurePhases(SURVEY_END).run).toBe(0);
    expect(departurePhases(CLEAR_END).run).toBe(0);
  });

  it('completes the takeoff run by the end of the section', () => {
    expect(departurePhases(1).run).toBeCloseTo(1, 6);
  });

  // Ease-in, not linear: a departing aircraft accelerates, so it must have
  // covered less than half the distance at the halfway point of the run.
  it('accelerates through the takeoff run', () => {
    const mid = departurePhases((CLEAR_END + 1) / 2).run;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(0.4);
  });

  it('clamps progress outside the section', () => {
    expect(departurePhases(-0.4)).toEqual({ survey: 0, clear: 0, run: 0, thrust: 0 });
    expect(departurePhases(1.6)).toEqual({ survey: 1, clear: 1, run: 1, thrust: 1 });
  });
});

describe('departurePhases thrust', () => {
  it('spools up only once the sheet is clear', () => {
    expect(departurePhases(0.5).thrust).toBe(0);
    expect(departurePhases(CLEAR_END).thrust).toBe(0);
  });

  it('reaches full power by the end of the run', () => {
    expect(departurePhases(1).thrust).toBeCloseTo(1, 6);
  });

  // The engines are at power before the aircraft has covered any distance.
  // Without this the wake only becomes dense once the airframe is already off
  // the left of the frame, which is exactly where nobody can see it.
  it('leads the acceleration all the way through the run', () => {
    for (let p = CLEAR_END + 0.005; p < 1; p += 0.01) {
      const { run, thrust } = departurePhases(p);
      expect(thrust).toBeGreaterThan(run);
    }
  });
});
