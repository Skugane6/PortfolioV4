/**
 * Picks the scroll-progress values Experience settles onto once the user
 * stops scrolling: the datum (nothing revealed yet) and each callout once
 * it's fully in view. Derived from the same reveal-schedule constants the
 * cards already animate against, rather than tuned separately, so a change
 * to one can't quietly desync from the other.
 */

// Wide layout accumulates callouts: each finishes revealing at its own
// start plus the shared span, so that's the moment worth settling on.
export function wideStagePoints(starts: readonly number[], span: number): number[] {
  return [0, ...starts.map((start) => start + span)];
}

// Stacked layout reuses one slot per card, held fully revealed between
// [riseEnd, fallStart] (see Experience's `win`). The middle of that hold is
// the calmest point to settle on — as far as possible from both the rise
// and the next card's fall. `surveyEnd` converts the window's survey-progress
// units back to the raw progress the rest of Experience is driven by.
export function stackedStagePoints(
  windows: ReadonlyArray<readonly [number, number, number, number]>,
  surveyEnd: number
): number[] {
  return [0, ...windows.map(([, riseEnd, fallStart]) => ((riseEnd + fallStart) / 2) * surveyEnd)];
}

// Simple nearest-neighbour pick. `stages` is always non-empty (both
// functions above always emit the leading 0), so there's always a fallback.
// Used only as pickSnapTarget's no-direction fallback below — plain nearest-
// neighbour is what made snapping revert on an ordinary scroll that hadn't
// reached the next stage yet (see pickSnapTarget).
export function nearestStage(p: number, stages: readonly number[]): number {
  return stages.reduce((best, stage) => (Math.abs(stage - p) < Math.abs(best - p) ? stage : best), stages[0]);
}

// Default share of the gap between two stages the user has to cross, in
// their scroll direction, before the far stage counts as reached. Small on
// purpose: this also gates how much of a scroll it takes for a callout to
// commit to fully revealed (see Experience's apply), and a wide gap there
// reads as the card being slow to catch up.
const DEFAULT_COMMIT_FRACTION = 0.18;

/**
 * Chooses where to settle given the direction the user was just scrolling —
 * and, critically, never chooses the stage *behind* that direction once the
 * user has meaningfully committed to it. Ordinary wheel/trackpad input
 * arrives in short bursts with brief pauses between them, so nearest-
 * neighbour picking (ignoring direction) reverts to the stage just left on
 * almost every one of those pauses, before the gesture has actually
 * finished — that reads as the page fighting the scroll.
 *
 * Scrolling down resolves to the next stage ahead once travel past the
 * stage behind clears `commitFraction` of the gap, and to the stage behind
 * otherwise (a fraction this small makes that a rest of only a few percent
 * of the gap — in practice noise, not a reversal of real forward scroll);
 * scrolling up mirrors both ends of that. This always resolves to one stage
 * or the other — never lingers between them — so a callout's reveal (and the
 * scroll position itself) never rests at a partial, undecided state.
 *
 * `stages` must be sorted ascending (true of both point functions above).
 */
export function pickSnapTarget(
  p: number,
  stages: readonly number[],
  direction: 1 | -1 | 0,
  commitFraction = DEFAULT_COMMIT_FRACTION
): number {
  if (direction === 0) return nearestStage(p, stages);

  let lower = stages[0];
  let upper = stages[stages.length - 1];
  for (const stage of stages) if (stage <= p) lower = stage;
  for (let i = stages.length - 1; i >= 0; i--) if (stages[i] >= p) upper = stages[i];
  // p is at or past every stage (or before all of them) — nothing to bracket.
  if (upper <= lower) return lower;

  const within = (p - lower) / (upper - lower);
  if (direction > 0) return within >= commitFraction ? upper : lower;
  return within <= 1 - commitFraction ? lower : upper;
}
