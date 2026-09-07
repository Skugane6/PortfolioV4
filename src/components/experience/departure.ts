/**
 * Splits the Experience section's scroll progress into the three phases the
 * sheet actually goes through: the survey, the clear-out, and the takeoff run.
 *
 * The survey used to own the whole section. It still owns the same *distance*
 * — the section grew by the length of the takeoff run rather than the survey
 * being squeezed — but it now finishes at SURVEY_END, so every callout window
 * and fade in Experience is fed `survey` instead of raw progress and keeps the
 * meaning it was tuned with.
 */

// Where the last callout has landed and the sheet starts packing up. This is
// also the scroll position where the sticky stage lets go — see
// sectionProgress — so the survey owns the pin and the departure owns the
// scroll out of it.
export const SURVEY_END = 0.8;
// Where the sheet is empty and the airframe is free to leave.
export const CLEAR_END = 0.88;

/**
 * Maps scroll into the section onto the 0–1 progress the phases above are
 * written against, from two separate measures.
 *
 * The split is at CLEAR_END, not SURVEY_END: the survey *and* the clear-out
 * both happen while the stage is pinned, so that the sheet is already empty at
 * the instant the section lets go. The takeoff run then gets `departTravel` of
 * scroll *past* the release — the same scroll that lifts the stage away and
 * brings the next section up. The aircraft therefore leaves while the page is
 * already moving on, instead of during a stretch of pinned scroll with nothing
 * else happening in it.
 */
export function sectionProgress(scrolled: number, pinnedTravel: number, departTravel: number) {
  if (scrolled <= 0) return 0;
  if (scrolled < pinnedTravel) return (scrolled / pinnedTravel) * CLEAR_END;
  const past = Math.min(1, (scrolled - pinnedTravel) / Math.max(1, departTravel));
  return CLEAR_END + past * (1 - CLEAR_END);
}

/**
 * Full inverse of sectionProgress: how far the page has to be scrolled (in
 * the same units as `scrolled` there — pinned and past-release scroll both,
 * added together) to read a given progress. Used to scroll-snap onto a
 * progress value, including the takeoff run past the release — see
 * Experience's trySnap, which eases the whole close-and-depart sequence in
 * one animated scroll once the survey's last stage has been left behind.
 *
 * Clamps to [0, 1] first so this is correct standalone regardless of what
 * callers pass.
 */
export function progressToScrolled(p: number, pinnedTravel: number, departTravel: number) {
  const clamped = Math.max(0, Math.min(1, p));
  if (clamped <= CLEAR_END) return (clamped / CLEAR_END) * pinnedTravel;
  const past = (clamped - CLEAR_END) / (1 - CLEAR_END);
  return pinnedTravel + past * departTravel;
}

// How far left the airframe travels over the run. Sized so it clears the
// frame at the *end* of the run rather than partway through: the plate is at
// most 88vw and centred, so its trailing edge starts ~94vw from the left
// edge, and a little slack covers the roll. Overshooting this parks an
// off-screen aircraft for the tail of the section, which reads as the
// departure having stalled.
export const DEPARTURE_TRAVEL_VW = 98;
// Climb and nose-up attitude at the end of the run. The climb is modest
// because the departure now runs while the whole stage is scrolling up out of
// the viewport — the page is already carrying the aircraft upward, and piling
// a large climb on top of that outruns the wake.
export const DEPARTURE_CLIMB_PX = 24;
export const DEPARTURE_PITCH_DEG = 2.5;

/**
 * Length of the takeoff run, in viewport heights of scroll past the sticky
 * release. The stage is one viewport tall and the airframe sits mid-stage, so
 * the page carries it off the top after about half a viewport of scroll-out —
 * the run has to be comfortably shorter than that or the aircraft is taken
 * upward out of frame before it can finish leaving to the left.
 */
export const DEPART_VH = 40;

export interface DeparturePhases {
  /** 0–1 across the survey, driving the callout reveals. */
  survey: number;
  /** 0–1 as the cards, leader lines and drafting furniture clear the sheet. */
  clear: number;
  /** 0–1 across the takeoff run, eased in so the airframe accelerates away. */
  run: number;
  /**
   * 0–1 engine power over the same window, but eased *out* so it leads `run`.
   * The engines spool to full thrust before the aircraft has covered any
   * distance, which is both what happens on a real roll and what puts the
   * wake at full density while the airframe is still in frame.
   */
  thrust: number;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function departurePhases(p: number): DeparturePhases {
  const run = clamp01((p - CLEAR_END) / (1 - CLEAR_END));
  return {
    survey: clamp01(p / SURVEY_END),
    clear: clamp01((p - SURVEY_END) / (CLEAR_END - SURVEY_END)),
    // Squared rather than linear: an aircraft leaving the frame at a constant
    // rate reads as a slide, not as a departure.
    run: run * run,
    thrust: Math.sqrt(run),
  };
}
