/**
 * Timing for the Experience survey, as pure functions of pinned-scroll
 * progress p (0 when the sheet pins, 1 when it lets go).
 *
 *   0.00–0.04  the drawing is up (it plotted while the sheet scrolled in)
 *   0.04–0.86  callouts dock one after another, fore to aft
 *   0.86–0.90  held: the complete drawing, all cards readable
 *   0.90–0.96  the inspection stamp lands; readout reaches 100%
 *   0.96–1.00  held, then the sheet scrolls on
 */
const DOCK_START = 0.04;
const DOCK_END = 0.86;
const STAMP_START = 0.9;
const STAMP_END = 0.96;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface SurveyPhases {
  /** 0→1 per callout. */
  docks: number[];
  /** 0→1 as the stamp is pressed. */
  stamp: number;
  /** Readout, 0–100, whole numbers. 100 exactly when the stamp lands. */
  percent: number;
}

export function dockAt(p: number, i: number, n: number): number {
  const w = (DOCK_END - DOCK_START) / n;
  // Each callout docks over the first 80% of its window, so it is complete
  // (and readable) before the next one starts drawing.
  return clamp01((p - (DOCK_START + i * w)) / (w * 0.8));
}

export function stampAt(p: number): number {
  return clamp01((p - STAMP_START) / (STAMP_END - STAMP_START));
}

export function surveyPhases(p: number, n: number): SurveyPhases {
  const docks = Array.from({ length: n }, (_, i) => dockAt(p, i, n));
  const stamp = stampAt(p);
  const percent = stamp >= 1 ? 100 : Math.min(99, Math.floor(clamp01(p / STAMP_END) * 100));
  return { docks, stamp, percent };
}

/**
 * Within one callout's dock (d, 0→1): the leader drops from the station,
 * runs across to the card's column, drops into the card, then the card
 * appears. The order a draughtsman would draw it in.
 */
export function dockParts(d: number) {
  return {
    leaderDown: clamp01(d / 0.25),
    leaderAcross: clamp01((d - 0.25) / 0.2),
    leaderIn: clamp01((d - 0.45) / 0.15),
    card: clamp01((d - 0.6) / 0.4),
  };
}

/** The pinned progress at which callout i has just finished docking. */
export function progressForCallout(i: number, n: number): number {
  const w = (DOCK_END - DOCK_START) / n;
  return DOCK_START + i * w + w * 0.85;
}
