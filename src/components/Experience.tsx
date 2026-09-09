import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { animate, type AnimationPlaybackControls } from 'framer-motion';
import { experience, education } from '../data/experience';
import { HudCard, RING_INSET } from './experience/HudCard';
import {
  AirframeNotes,
  SheetMarks,
  SpecBlock,
  type SheetDetail,
} from './experience/BlueprintAnnotations';
import {
  CLEAR_END,
  DEPARTURE_CLIMB_PX,
  DEPARTURE_PITCH_DEG,
  DEPARTURE_TRAVEL_VW,
  DEPART_VH,
  SURVEY_END,
  departurePhases,
  progressToScrolled,
  sectionProgress,
} from './experience/departure';
import { pickSnapTarget, stackedStagePoints, wideStagePoints } from './experience/snap';
import { WakeField, type WakeHandle } from './experience/WakeField';
import { glowGradient } from './experience/glow';

const role = experience[0];

// 100vh of this is the sticky stage; the remaining 330vh is pinned travel,
// which carries the 300vh survey the callouts were tuned against plus the
// ~30vh clear-out that empties the sheet before the stage lets go. The takeoff
// run itself adds no height: it runs on the scroll *past* this section (see
// DEPART_VH), which is the same scroll that brings Projects up.
export const SECTION_VH = 430;

// Below this rendered plate width the two-up card row can no longer hold a
// readable column, so the callouts switch to a single slot shown one at a
// time. Measured against the width the plate *would* take in the wide layout
// (78vw, capped) rather than its current width. The stacked plate is capped
// well below this, so reading the live width would make the switch one-way.
const STACK_BREAKPOINT = 850;
// The four-up layout also needs vertical room: on a short viewport fit() has
// to shrink it far enough that the body copy stops being readable.
const SHORT_VIEWPORT = 700;

// Clear air between the airframe and the nearest card edge. Fixed px, not a
// share of the plate: the plate is only ~60px tall on a phone, so the old
// percentage offset put the card on top of the fuselage.
const WIDE_GAP = 22;
const STACK_GAP = 30;

// Stacked cards are sized off the stage, not the plate, because the plate is a
// 5:1 letterbox, so matching it makes for either 90-character lines on a
// tablet or a needlessly pinched column on a phone.
const STACK_CARD_MAX = 500;
// From md up the NavRail is a vertical strip on the right edge; keep the
// stacked card clear of it. Below md the rail is a bottom bar, so the card
// only owes the screen edge a gutter.
const RAIL_GUTTER = 170;
const EDGE_GUTTER = 16;
// PARALLAX_TRANSFORM grows the assembly to this by the end of the scroll, so
// the card has to be budgeted at its largest or it rides out through the
// gutter it was sized to sit inside.
const PARALLAX_MAX_SCALE = 1.06;

// How far down the stage the spec block reaches, measured from the HUD band it
// hangs off. On a short viewport the assembly rides up past this and the table
// would print over the tail, so it only appears when the airframe clears it.
const SPEC_BLOCK_BOTTOM = 196;

// Per-callout reveal alphas, written on the stage as custom properties.
const ALPHAS = ['--a1', '--a2', '--a3', '--a4'];

const WIDE_STARTS = [0.08, 0.26, 0.44, 0.62];
const WIDE_SPAN = 0.18;
const STACKED_WINDOWS: Array<[number, number, number, number]> = [
  [0.1, 0.18, 0.28, 0.33],
  [0.34, 0.42, 0.52, 0.57],
  [0.58, 0.66, 0.76, 0.81],
  [0.82, 0.9, 1.01, 1.02],
];

// The final stage past the survey: cards closed, airframe fully departed.
// Scrolling a little past the last callout commits to this the same way as
// any other stage. It just plays out over a bigger, slower motion (see
// DEPARTURE_SPRING) since it's closing four cards and flying the airframe
// off, not settling onto the next one.
const DEPARTED_STAGE = 1;

// Which callout the survey currently counts as committed to (apply, every
// frame): the datum, then each callout once it's fully revealed. Built from
// the reveal schedules above so they can't drift out of sync with what's
// actually on screen. Deliberately stops at the last callout rather than
// including DEPARTED_STAGE. Past it, pickSnapTarget's bracket naturally
// clamps to that last entry, so a callout's own alpha spring stays parked at
// fully revealed and never fights the *continuous*, scroll-tied clear-out
// fade already applied below. Committing all the way to departed is a
// bigger, slower motion than any one callout's own pop; if the two closed
// the cards on separate schedules, "close and fly away" would read as two
// disjoint motions instead of one.
const WIDE_SURVEY_STAGES = wideStagePoints(WIDE_STARTS, WIDE_SPAN);
const STACKED_SURVEY_STAGES = stackedStagePoints(STACKED_WINDOWS, SURVEY_END);

// Where the *page* settles once the user stops scrolling (trySnap): the same
// callout stages above, plus the fully-departed endpoint. Scrolling a
// little past the last callout eases through the whole close-and-depart
// sequence in one motion (see DEPARTURE_SPRING).
const WIDE_STAGE_POINTS = [...WIDE_SURVEY_STAGES, DEPARTED_STAGE];
const STACKED_STAGE_POINTS = [...STACKED_SURVEY_STAGES, DEPARTED_STAGE];

// Share of the gap to the next stage that has to be crossed, in the
// direction just scrolled, before that stage counts as reached (see
// snap.ts's pickSnapTarget). Small on purpose: both a callout's own reveal
// and the page settling onto it should commit almost as soon as the scroll
// is clearly headed that way, not once it's mostly there.
const SNAP_COMMIT_FRACTION = 0.18;

// How long the scroll has to sit still before the *page* eases onto a stage.
// Ordinary wheel and trackpad input arrives in short bursts with brief gaps
// between them, so this has to clear those gaps, or a snap fires mid-gesture,
// between two notches the user hasn't finished making yet. The callouts
// themselves don't wait on this: see CARD_SPRING below.
const SNAP_IDLE_MS = 200;
// Critically damped: settles onto the stage without any bounce or overshoot,
// which reads as smoother than a fixed-duration ease for a distance that
// varies with how far off the stage the scroll happened to stop.
const SNAP_SPRING = { type: 'spring', stiffness: 320, damping: 36, restDelta: 0.5, restSpeed: 0.5 } as const;
// Ignore a rest that's already this close to a stage: otherwise floating-
// point noise in the scroll math can retrigger a no-op animation loop.
const SNAP_EPSILON = 0.004;

// Drives each callout's own reveal alpha: a quick, critically damped pop
// rather than a ramp tied to scroll pixels, so there is no scroll speed slow
// enough to watch a card sit half-lit. Stiffer than SNAP_SPRING: the page
// easing into place is a large, visible motion that should stay gentle;
// a callout committing is a small one that should read as decisive.
const CARD_SPRING = { type: 'spring', stiffness: 520, damping: 44, restDelta: 0.004, restSpeed: 0.004 } as const;

// Carries the whole close-and-depart sequence once it's committed to (see
// trySnap): softer and slower than SNAP_SPRING, on purpose. This scroll
// covers the clear-out *and* the takeoff run, and the wake, roll, and climb
// all read as a rushed cut rather than a departure if they're compressed
// into the same ~350ms a single-stage settle uses.
const DEPARTURE_SPRING = { type: 'spring', stiffness: 100, damping: 20, restDelta: 0.5, restSpeed: 0.5 } as const;

// Per-callout dot placement. `above` is a wide-layout property only: cards 0
// and 3 sit above the airframe there, and drop below it, like the others,
// once stacked.
const CARD_META = [
  { dotLeft: 11.4, dotTop: 66, slide: { x: -30, y: 16 }, above: true },
  { dotLeft: 42.4, dotTop: 88, slide: { x: -26, y: -16 }, above: false },
  { dotLeft: 73.2, dotTop: 58, slide: { x: 26, y: -16 }, above: false },
  {
    // The fin's leading edge, the only structure this far aft that a leader
    // line can land on without crossing the stabiliser.
    dotLeft: 87,
    dotTop: 32,
    slide: { x: 30, y: 16 },
    above: true,
  },
];

// The leader line always grows out of the station dot toward its card, so the
// drawing reads as annotating itself: `origin` is the end that stays put under
// the scaleY reveal, and the gradient puts the bright end on the dot.
function leaderLine(meta: (typeof CARD_META)[number], stacked: boolean) {
  const gap = stacked ? STACK_GAP : WIDE_GAP;
  if (!stacked && meta.above) {
    return {
      origin: 'bottom' as const,
      top: `-${gap}px`,
      height: `calc(${meta.dotTop}% + ${gap}px)`,
    };
  }
  return {
    origin: 'top' as const,
    top: `${meta.dotTop}%`,
    height: `calc(${100 - meta.dotTop}% + ${gap}px)`,
  };
}

// "STA 145 · FWD" -> "Sta 145 · fwd", for the HUD phase readout.
function toPhaseLabel(station: string) {
  return station.charAt(0) + station.slice(1).toLowerCase();
}

// Shared by the image, its leader-line/dot overlay, and the callout cards so
// all four ride together as one rigid sheet. Applying this to some layers
// and not others is what let the lines drift away from their cards as p grew:
// the image can shift ~45px at the scroll extremes, and anything not
// sharing this transform stays put while it does.
// --kx gates the sideways drift alone. Stacked cards are sized against the
// screen rather than the plate, so a ±12px sideways ride would push them
// through their gutters; they keep the vertical drift and the scale.
// Reads --sp (survey progress) rather than raw --p: past SURVEY_END the drift
// has to settle so the departure below is the only motion left on the sheet.
const PARALLAX_TRANSFORM =
  'translate3d(calc((0.5 - var(--sp, 0)) * 6.2vw * var(--k, 1) * var(--kx, 1)), calc(var(--sp, 0) * -22px * var(--k, 1)), 0) scale(calc(1.005 + var(--sp, 0) * 0.055))';

// Applied to the whole plate group, outermost, so it composes over the fit
// scale and carries the image, the leader lines and the cards together. --kd
// is the reduced-motion gate: there the assembly stays put and fades instead
// (see --fade on the group's opacity).
const DEPARTURE_TRANSFORM =
  `translate3d(calc(var(--run, 0) * -${DEPARTURE_TRAVEL_VW}vw * var(--kd, 1)), calc(var(--run, 0) * -${DEPARTURE_CLIMB_PX}px * var(--kd, 1) + var(--clear, 0) * var(--recentre, 0px) * var(--kd, 1)), 0) ` +
  `rotate(calc(var(--run, 0) * -${DEPARTURE_PITCH_DEG}deg * var(--kd, 1))) ` +
  'translateY(var(--shift, 0px)) scale(var(--fit, 1))';

// Each card box is its plate plus the RING_INSET band the offset outline lives
// in, so every anchor below backs off by that band to leave the plate, and
// therefore the leader line meeting its corner, exactly where it was.
const R = `${RING_INSET}px`;
const pad = (v: string) => `calc(${v} - ${R})`;
const grow = (v: string) => `calc(${v} + ${RING_INSET * 2}px)`;

function cardPositionStyle(index: number, stacked: boolean): CSSProperties {
  if (stacked) {
    // --cardw is measured off the stage (see sync), so centre the card on the
    // stage rather than filling the plate. 50% resolves against the plate,
    // and the plate is centred, so this lands on the stage's midline too.
    return {
      left: `calc(50% - var(--cardw, 100%) / 2 - ${R})`,
      top: pad(`calc(100% + ${STACK_GAP}px)`),
      width: grow('var(--cardw, 100%)'),
    };
  }
  const clear = `calc(100% + ${WIDE_GAP}px)`;
  if (index === 0) return { left: pad('1%'), bottom: pad(clear), width: grow('min(440px, 37vw)') };
  // Card 1's dot sits at 42.4% of the plate. Anchoring from the left at 1.5%
  // (like the original reference) never reaches that far right at any
  // desktop width: the card's own width (min(404px, 31vw)) tops out at
  // 34-40% of the plate depending on viewport, so the dot always lands past
  // its right edge and the leader line misses the card entirely. Anchoring
  // further right at 10% keeps the dot inside the card at every width.
  if (index === 1) return { left: pad('10%'), top: pad(clear), width: grow('min(404px, 31vw)') };
  if (index === 2) return { right: pad('1.5%'), top: pad(clear), width: grow('min(404px, 31vw)') };
  // Card 3 mirrors card 0 across the airframe: above the plate, anchored to
  // the right edge so its leader line drops onto the fin.
  return { right: pad('1.5%'), bottom: pad(clear), width: grow('min(404px, 31vw)') };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLImageElement>(null);
  const wakeRef = useRef<WakeHandle>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const runningRef = useRef(false);
  const stackedRef = useRef(false);
  const snapTimerRef = useRef<number>();
  const snapControlsRef = useRef<AnimationPlaybackControls | null>(null);
  // The scrollY a running snap animation just set, so onScrollForSnap can
  // tell its own output apart from a genuine user scroll (see trySnap).
  const lastSnapYRef = useRef<number | null>(null);
  // Track real scroll movement so trySnap never picks a stage behind the
  // direction the user was just scrolling in (see pickSnapTarget).
  const lastScrollYRef = useRef(0);
  const scrollDirRef = useRef<1 | -1 | 0>(0);
  // Each callout's current spring-eased reveal alpha (0..1), and the
  // animation driving it toward wherever it last committed to. Kept apart
  // from the `cardRevealed` state below so the spring can update every frame
  // without going through React (see apply).
  const cardAlphaRef = useRef([0, 0, 0, 0]);
  const cardAlphaControlsRef = useRef<Array<AnimationPlaybackControls | null>>([null, null, null, null]);
  // Last committed reveal per callout, compared against each frame's fresh
  // pick so a spring only (re)starts on an actual change, not every frame.
  const revealedRef = useRef([false, false, false, false]);
  const detailRef = useRef<SheetDetail>('full');
  const lastRef = useRef({ pct: -1, phase: '' });

  // Read once, at mount, rather than in an effect: the wake canvas must never
  // be mounted for a reduced-motion visitor, not even for a frame.
  const [reduced] = useState(prefersReducedMotion);
  const [stacked, setStacked] = useState(false);
  const [detail, setDetail] = useState<SheetDetail>('full');
  const [showSpec, setShowSpec] = useState(false);
  const [readout, setReadout] = useState(0);
  const [phase, setPhase] = useState('Datum');
  // Which callouts are currently committed to shown, only for the text
  // stagger inside HudCard; the card's own fade/slide reads cardAlphaRef
  // directly via --a{i} and never waits on a re-render.
  const [cardRevealed, setCardRevealed] = useState([false, false, false, false]);

  // Writes --p/--a1../--a3 for the current frame and mirrors the percent and
  // phase readouts into state (only on change, so this doesn't re-render on
  // every frame). Reads stackedRef rather than the `stacked` state so it
  // always sees the latest layout even though this closure is only ever
  // created once (see the mount effect below).
  const apply = (p: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.style;
    const { survey, clear, run, thrust } = departurePhases(p);
    s.setProperty('--p', p.toFixed(4));
    s.setProperty('--sp', survey.toFixed(4));
    s.setProperty('--run', run.toFixed(4));
    s.setProperty('--clear', clear.toFixed(4));
    // Everything that belongs to the sheet rather than to the aircraft
    // (drafting furniture, title block, education line) rides this out.
    s.setProperty('--sheet', (1 - clear).toFixed(4));

    // Which callout the survey currently counts as committed to, using the
    // same direction-aware rule the page's own scroll-snap settles on (see
    // pickSnapTarget), evaluated every frame rather than debounced, so a
    // callout's reveal never waits on the page's slower, deliberately-idle
    // snap to decide it's arrived. Index 0 is the datum (nothing revealed
    // yet); i+1 is callout i. `pickSnapTarget` always returns one of
    // `stages`' own values, so indexOf is exact, never a near-miss. Uses the
    // survey-only stages (see their definition above). Past the last one,
    // its bracket clamps to that entry, so every callout stays fully
    // revealed and the clear-out below is the only thing that closes them.
    const stages = stackedRef.current ? STACKED_SURVEY_STAGES : WIDE_SURVEY_STAGES;
    const committed = stages.indexOf(pickSnapTarget(p, stages, scrollDirRef.current, SNAP_COMMIT_FRACTION));
    // Wide accumulates every callout up to the committed one (they're meant
    // to all be on screen together); stacked shows only the one just landed
    // on, reusing its single slot.
    const nextRevealed = CARD_META.map((_, i) => (stackedRef.current ? committed === i + 1 : committed >= i + 1));

    // A callout's alpha now hops in one spring rather than riding the raw
    // scroll continuously, so (re)start it only on an actual change, not
    // every frame, and not away from wherever it currently sits mid-hop.
    let revealChanged = false;
    nextRevealed.forEach((isRevealed, i) => {
      if (isRevealed === revealedRef.current[i]) return;
      revealChanged = true;
      revealedRef.current[i] = isRevealed;
      cardAlphaControlsRef.current[i]?.stop();
      cardAlphaControlsRef.current[i] = animate(cardAlphaRef.current[i], isRevealed ? 1 : 0, {
        ...CARD_SPRING,
        onUpdate: (v) => {
          cardAlphaRef.current[i] = v;
        },
      });
    });
    if (revealChanged) setCardRevealed([...revealedRef.current]);

    // The clear-out still rides the raw scroll continuously: it's the
    // departure beginning, not another stage to commit to, so it multiplies
    // whatever the spring has reached rather than being folded into it.
    const as = cardAlphaRef.current.map((a) => a * (1 - clear));
    as.forEach((a, i) => s.setProperty(`--a${i + 1}`, a.toFixed(4)));

    wakeRef.current?.pump(thrust);

    // Against CLEAR_END, not the section: the readout tracks the survey, and
    // the survey is finished (sheet empty) at the moment the stage unpins.
    // Measuring it against the whole section would leave the bar stuck at 88%
    // for the only part of the departure the HUD is still on screen for.
    const pct = Math.min(100, Math.round((p / CLEAR_END) * 100));
    if (pct !== lastRef.current.pct) {
      lastRef.current.pct = pct;
      setReadout(pct);
    }

    // Read the label off whichever callout is actually lit, so it can never
    // name a station whose card isn't on screen. Highest lit index, not the
    // strongest: wide mode accumulates callouts and all of them sit at alpha
    // 1, so the readout must name the newest arrival.
    let lit = -1;
    as.forEach((a, i) => {
      if (a > 0.4) lit = i;
    });
    let nextPhase: string;
    // The two departure states outrank the survey labels: once the sheet is
    // packing up there is no station left to name. "Departing" is keyed to the
    // clear-out rather than to the run, because the run happens on scroll past
    // the release, by which point this HUD has been carried off the top of
    // the screen and nobody would ever read it.
    if (run > 0 || clear > 0.45) nextPhase = 'Departing';
    else if (clear > 0 || (lit === role.callouts.length - 1 && survey >= 0.92))
      nextPhase = 'Survey complete';
    else if (lit >= 0) nextPhase = toPhaseLabel(role.callouts[lit].station);
    else if (survey < 0.16 && as.every((v) => v <= 0.001)) nextPhase = 'Datum';
    // Mid-handover the slot is briefly empty; hold the last station rather
    // than snapping back to the datum.
    else nextPhase = lastRef.current.phase || 'Datum';

    if (nextPhase !== lastRef.current.phase) {
      lastRef.current.phase = nextPhase;
      setPhase(nextPhase);
    }
  };

  const read = () => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    apply(
      sectionProgress(
        -r.top,
        Math.max(1, r.height - window.innerHeight),
        window.innerHeight * (DEPART_VH / 100)
      )
    );
  };

  // A plain throttled scroll listener can swallow the last event of a jump
  // and leave progress stale, so read on every frame while in view.
  const tick = () => {
    if (!runningRef.current) return;
    read();
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    read();
  };

  // Fires once scroll has sat still for SNAP_IDLE_MS: measures fresh (the
  // stage may have resized or flipped layout since the last frame) and eases
  // the page onto whichever stage it's committed to in the direction just
  // scrolled: the same call apply() makes every frame for the callouts
  // themselves, just acted on after the scroll actually stops rather than
  // continuously. See pickSnapTarget for why this never moves the user
  // backward relative to their own scroll. Covers the takeoff run too, past
  // the pin's release, so a small scroll off the last callout eases through
  // the whole close-and-depart sequence in one motion (see DEPARTURE_SPRING).
  const trySnap = () => {
    const el = sectionRef.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const pinnedTravel = Math.max(1, r.height - window.innerHeight);
    const departTravel = window.innerHeight * (DEPART_VH / 100);
    const scrolled = -r.top;
    // Outside the section's whole scroll range entirely, nothing to settle
    // onto (the far end being Projects fully in view, past even the run;
    // see targetY below).
    if (scrolled <= 0 || scrolled >= r.height) return;
    const p = sectionProgress(scrolled, pinnedTravel, departTravel);
    const stages = stackedRef.current ? STACKED_STAGE_POINTS : WIDE_STAGE_POINTS;
    const target = pickSnapTarget(p, stages, scrollDirRef.current, SNAP_COMMIT_FRACTION);
    if (Math.abs(target - p) < SNAP_EPSILON) return;

    // The takeoff run itself only needs DEPART_VH of scroll to finish (the
    // airframe is off-frame well before Projects is), but stopping there
    // leaves the reader in an empty stretch of the (now-unpinned) stage with
    // more manual scrolling ahead of them before Projects actually arrives.
    // Once departure is committed to, carry the scroll the rest of the way.
    const targetY =
      target === DEPARTED_STAGE
        ? (document.getElementById('projects')?.getBoundingClientRect().top ?? r.bottom) + window.scrollY
        : r.top + window.scrollY + progressToScrolled(target, pinnedTravel, departTravel);
    snapControlsRef.current?.stop();
    snapControlsRef.current = animate(window.scrollY, targetY, {
      ...(target === DEPARTED_STAGE ? DEPARTURE_SPRING : SNAP_SPRING),
      onUpdate: (v) => {
        // Recorded before scrolling so onScrollForSnap sees it no matter
        // when the browser actually dispatches the resulting scroll event.
        lastSnapYRef.current = v;
        window.scrollTo(0, v);
      },
      onComplete: () => {
        lastSnapYRef.current = null;
      },
    });
  };

  // Debounces trySnap behind real scroll events (rather than the rAF loop
  // above, which runs every frame regardless of whether scroll actually
  // moved) so it only fires once the user has actually stopped. Also keeps
  // scrollDirRef current, from real scrolls only: see below.
  const onScrollForSnap = () => {
    const y = window.scrollY;
    // The snap's own scrollTo calls fire this same listener. Recognise those
    // by comparing against the position we just set, rather than a flag that
    // covers the whole animation: a flag that broad would also swallow a
    // real scroll the user makes *while* a snap is still easing in, and the
    // animation would keep steamrolling their input instead of yielding.
    const selfCaused = lastSnapYRef.current !== null && Math.abs(y - lastSnapYRef.current) <= 2;
    // Direction only ever comes from the user's own scrolling. Folding the
    // snap animation's own motion in here would make every snap "confirm"
    // whichever direction it happened to travel in.
    if (!selfCaused) {
      const dy = y - lastScrollYRef.current;
      if (dy !== 0) scrollDirRef.current = dy > 0 ? 1 : -1;
    }
    lastScrollYRef.current = y;
    if (selfCaused) return;

    snapControlsRef.current?.stop();
    snapControlsRef.current = null;
    lastSnapYRef.current = null;
    window.clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(trySnap, SNAP_IDLE_MS);
  };

  const startSnap = () => {
    if (reduced) return;
    lastScrollYRef.current = window.scrollY;
    scrollDirRef.current = 0;
    window.addEventListener('scroll', onScrollForSnap, { passive: true });
  };

  const stopSnap = () => {
    window.removeEventListener('scroll', onScrollForSnap);
    window.clearTimeout(snapTimerRef.current);
    snapControlsRef.current?.stop();
    snapControlsRef.current = null;
    lastSnapYRef.current = null;
  };

  // Cancels any in-flight callout reveal springs: otherwise they'd keep
  // running (framer-motion drives them off their own rAF, independent of
  // this component's) after the section leaves view or unmounts, and jumps
  // straight to whichever end each was headed for, rather than leaving it
  // stranded mid-hop for the rare case that catches one still running (a fast
  // enough fling to clear the section, plus its 120px margin, inside the
  // spring's own ~250ms).
  const stopCardSprings = () => {
    cardAlphaControlsRef.current.forEach((controls, i) => {
      controls?.stop();
      cardAlphaRef.current[i] = revealedRef.current[i] ? 1 : 0;
    });
    cardAlphaControlsRef.current = [null, null, null, null];
  };

  // Reduced motion kills the parallax drift (--k) and the departure's travel
  // and roll (--kd), swapping the fly-out for a plain fade (--fade). The
  // callouts still reveal on scroll, same as full motion.
  useEffect(() => {
    const s = stageRef.current?.style;
    s?.setProperty('--k', reduced ? '0' : '1');
    s?.setProperty('--kd', reduced ? '0' : '1');
    s?.setProperty('--fade', reduced ? '1' : '0');
  }, [reduced]);

  // Re-measures the plate width (for the stacked/wide breakpoint) and scales
  // + re-centers the whole assembly to fit between the HUD and footer bands,
  // since the callout cards can push the assembly taller than the viewport.
  useEffect(() => {
    const stage = stageRef.current;
    const plate = plateRef.current;
    if (!stage || !plate) return;

    const fit = () => {
      const s = stage.style;
      s.setProperty('--fit', '1');
      s.setProperty('--shift', '0px');

      // Measure with every callout pinned to its revealed position. Unrevealed
      // cards are still offset by their slide vectors, which pulls the top and
      // bottom of the assembly ~16px in on each side, enough for the fit to
      // come out at 1 on a layout that overruns once the cards land.
      const revealed = ALPHAS.map((v) => s.getPropertyValue(v));
      ALPHAS.forEach((v) => s.setProperty(v, '1'));

      // Measure the image and the cards directly rather than walking
      // plate.children: the cards now sit inside an `inset-0` wrapper (so it
      // shares the image's parallax transform) whose own box never grows
      // past the plate even though its card children are absolutely
      // positioned below it.
      let top = Infinity;
      let bottom = -Infinity;
      plate.querySelectorAll('img, [data-card-index]').forEach((el) => {
        const r = el.getBoundingClientRect();
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
      });

      ALPHAS.forEach((v, i) => {
        if (revealed[i]) s.setProperty(v, revealed[i]);
        else s.removeProperty(v);
      });
      const pr = plate.getBoundingClientRect();
      top = Math.min(top, pr.top);
      bottom = Math.max(bottom, pr.bottom);

      // The HUD title block and footer own fixed bands at the top and bottom
      // of the stage; the plate assembly gets what's left, centred in that
      // band rather than in the whole stage. Only the top-right progress
      // readout stays put (the title block and footer fade as the survey
      // starts), so the assembly may use nearly the whole stage.
      const sr = stage.getBoundingClientRect();
      const GAP = 18;
      const hr = hudRef.current?.getBoundingClientRect();
      const bandTop = (hr ? hr.top : sr.top + 30) + GAP;
      // The title block no longer fades out of the assembly's way, so measure
      // it rather than reserving a guessed band: it sits higher on narrow
      // viewports, where it has to clear the mobile nav bar too.
      const tr = titleBlockRef.current?.getBoundingClientRect();
      const bandBottom = (tr ? tr.top : sr.bottom - 74) - GAP;

      // PARALLAX_TRANSFORM grows the assembly from 1.005x to 1.06x across the
      // scroll, and fit() can run at any point in that range. Normalise the
      // measurement to the largest it will ever be, or the cards fit when
      // measured early and overrun the footer band by the time p reaches 1.
      const p = parseFloat(s.getPropertyValue('--p')) || 0;
      const need = (bottom - top) * (1.06 / (1.005 + p * 0.055));
      const room = bandBottom - bandTop;
      const scale = Math.max(0.66, Math.min(1, room / Math.max(1, need)));
      s.setProperty('--fit', scale.toFixed(3));

      // Re-centre: scaling happens about the plate group's own centre, so
      // work out where the assembly's midpoint lands and nudge it onto the
      // band's midpoint.
      const plateMid = (pr.top + pr.bottom) / 2;
      const assemblyMid = plateMid + ((top + bottom) / 2 - plateMid) * scale;
      const shift = (bandTop + bandBottom) / 2 - assemblyMid;
      s.setProperty('--shift', shift.toFixed(1) + 'px');

      // Where the fuselage ends up in the stage, for sheet furniture that has
      // to line up with the airframe rather than with the stage's midline.
      // The group scales about the plate's own centre, so only the shift moves
      // it.
      const planey = plateMid + shift - sr.top;
      s.setProperty('--planey', planey.toFixed(1) + 'px');

      // The survey parks the airframe off-centre to leave room for the callout
      // cards, badly so on a phone, where the single stacked card takes most
      // of the stage and the plate ends up in the top third. Once the cards
      // clear there is nothing left to make room for, so the departure takes
      // this much extra Y to settle the airframe onto the stage's midline. On
      // a wide layout the plate is already near centre and this is ~0.
      s.setProperty('--recentre', (sr.height / 2 - planey).toFixed(1) + 'px');
    };

    const sync = () => {
      // A resize can land mid-departure, when the plate group is most of a
      // screen to the left, rolled, and settled onto the stage midline.
      // Everything below measures live rects, and --recentre is derived from
      // a rect that --clear itself moves, so park the airframe on station for
      // the duration and restore both at the end.
      const runWas = stage.style.getPropertyValue('--run');
      const clearWas = stage.style.getPropertyValue('--clear');
      stage.style.setProperty('--run', '0');
      stage.style.setProperty('--clear', '0');

      // Derived from the viewport, not plate.clientWidth: the plate's own
      // width depends on which layout is active, so measuring it here would
      // latch the stacked layout on and never let it back off.
      const wideWidth = Math.min(1180, window.innerWidth * 0.78);
      const next = wideWidth < STACK_BREAKPOINT || window.innerHeight < SHORT_VIEWPORT;
      if (next !== stackedRef.current) {
        stackedRef.current = next;
        setStacked(next);
      }

      // md is where the NavRail leaves the bottom of the screen and the sheet
      // margins open up enough to carry notes beside the airframe.
      const nextDetail: SheetDetail = !next ? 'full' : window.innerWidth >= 768 ? 'mid' : 'compact';
      if (nextDetail !== detailRef.current) {
        detailRef.current = nextDetail;
        setDetail(nextDetail);
      }

      const s = stage.style;
      s.setProperty('--kx', next ? '0' : '1');
      // Measured as a half-width off the stage centre, since that is what the
      // card is centred on, then backed off by the scale and the ring band the
      // card's outline lives in.
      const gutter = window.innerWidth >= 768 ? RAIL_GUTTER : EDGE_GUTTER;
      const half = stage.clientWidth / 2 - gutter;
      const room = Math.round((half / PARALLAX_MAX_SCALE - RING_INSET) * 2);
      s.setProperty('--cardw', `${Math.max(260, Math.min(STACK_CARD_MAX, room))}px`);

      fit();

      // fit() has just placed the assembly, so this reads where the airframe
      // actually landed. The spec block's own presence does not move it
      // (the band is measured from the HUD's top edge), so this can't oscillate.
      const clearance = plate.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      setShowSpec(nextDetail !== 'compact' && clearance > SPEC_BLOCK_BOTTOM);

      if (runWas) stage.style.setProperty('--run', runWas);
      if (clearWas) stage.style.setProperty('--clear', clearWas);
      read();
    };

    sync();
    window.addEventListener('resize', sync);

    let ro: ResizeObserver | undefined;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(sync);
      ro.observe(stage);
      ro.observe(plate);
      // The callout cards drive the required height most: their text reflow
      // changes their own size without changing the stage or plate box.
      plate.querySelectorAll('[data-card-index]').forEach((el) => ro!.observe(el));
    }

    if (document.fonts?.ready) document.fonts.ready.then(sync);
    const t1 = window.setTimeout(sync, 400);
    const t2 = window.setTimeout(sync, 1200);

    const img = plate.querySelector('img');
    const onImgLoad = () => sync();
    if (img && !img.complete) img.addEventListener('load', onImgLoad, { once: true });

    return () => {
      window.removeEventListener('resize', sync);
      ro?.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      img?.removeEventListener('load', onImgLoad);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    read();
    if (!window.IntersectionObserver || !sectionRef.current) {
      start();
      startSnap();
      return () => {
        stop();
        stopSnap();
        stopCardSprings();
      };
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          startSnap();
        } else {
          stop();
          stopSnap();
          stopCardSprings();
        }
      },
      { rootMargin: '120px 0px' }
    );
    io.observe(sectionRef.current);
    return () => {
      io.disconnect();
      stop();
      stopSnap();
      stopCardSprings();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const footfade = stacked ? 8 : 3;

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative bg-bg"
      style={{ height: `${SECTION_VH}vh` }}
    >
      <div ref={stageRef} className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[10%] bg-[linear-gradient(to_right,rgba(96,128,180,0.075)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,128,180,0.075)_1px,transparent_1px)] bg-[length:32px_32px] will-change-transform"
          // The grid shears left with the departure at a fraction of the
          // airframe's rate, enough to register as the sheet being pulled
          // past, not so much that the whole page appears to slide.
          style={{
            transform:
              'translate3d(calc((0.5 - var(--sp, 0)) * -46px * var(--k, 1) + var(--run, 0) * -14vw * var(--kd, 1)), calc(var(--sp, 0) * -26px * var(--k, 1)), 0)',
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{
            // Sized so the falloff reaches zero inside the stage on every
            // axis: the stage clips its children, so a ramp still carrying
            // alpha at an edge is cut off there and shows as a seam. See
            // glow.ts, which owns that constraint and tests it.
            background: glowGradient(),
            // The glow is the pool of light the airframe sits in, so it goes
            // with it, at the same rate, or it detaches on the way out.
            transform:
              'translate3d(calc(var(--run, 0) * -60vw * var(--kd, 1)), calc(var(--sp, 0) * -40px * var(--k, 1)), 0)',
            opacity: 'calc(1 - var(--run, 0) * 0.85)',
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-6%] right-[-6%] top-1/2 h-0 will-change-transform"
          style={{
            transform:
              'translate3d(calc((0.5 - var(--sp, 0)) * 210px * var(--k, 1) + var(--run, 0) * -42vw * var(--kd, 1)), 0, 0)',
            opacity: 'calc(var(--sp, 0) * 2.4 * var(--sheet, 1))',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.34) 0 8px, transparent 8px 18px)' }} />
          <div className="absolute inset-x-0 top-px h-[9px]" style={{ background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.26) 0 1px, transparent 1px 72px)' }} />
          <div className="absolute inset-x-0 h-px" style={{ top: '-170px', background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.14) 0 3px, transparent 3px 12px)' }} />
          <div className="absolute inset-x-0 h-px" style={{ top: '190px', background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.14) 0 3px, transparent 3px 12px)' }} />
        </div>

        {/* Oversized outline word, the same device the Projects and Skills
            headers use, so all three sections are titled the same way. It sits
            behind the airframe (earlier in the DOM than the plate group) and
            only holds the sheet while it is otherwise empty: any callout
            opening takes it back out, so it never competes with a card for the
            reader's eye, and --sheet carries it off with the rest of the
            drafting furniture rather than letting it flare back as the
            clear-out closes the cards. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 flex justify-center"
          style={{
            // Stacked, the airframe rides high in the stage and the room is
            // all underneath it; wide, the airframe is centred and the room is
            // the band above. Either way the word takes the empty half rather
            // than sitting behind the aircraft, where the fuselage would eat
            // the middle of every letter.
            top: stacked ? '30vh' : 'clamp(76px, 16vh, 190px)',
            opacity:
              'calc((1 - max(var(--a1, 0), var(--a2, 0), var(--a3, 0), var(--a4, 0))) * var(--sheet, 1))',
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(44px, 11vw, 170px)',
              lineHeight: 0.9,
              letterSpacing: '.02em',
              whiteSpace: 'nowrap',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(140, 176, 255, .17)',
              userSelect: 'none',
            }}
          >
            EXPERIENCE
          </div>
        </div>

        {/* Before the plate group in the DOM, so the wake renders behind the
            airframe and appears to stream out from under it. */}
        {!reduced && <WakeField ref={wakeRef} planeRef={planeRef} />}

        <div
          className="will-change-transform"
          style={{
            transform: DEPARTURE_TRANSFORM,
            transformOrigin: 'center center',
            // Zero under full motion: the airframe leaves the frame rather
            // than dissolving in place. Reduced motion flips --fade to 1.
            opacity: 'calc(1 - var(--run, 0) * var(--fade, 0))',
          }}
        >
          {/* Stacked, the plate gets a bigger share of a narrow screen (the
              airframe is otherwise a 60px sliver on a phone) but is capped
              short of STACK_BREAKPOINT so widening it can never flip the
              layout back and forth. */}
          <div
            ref={plateRef}
            className="relative aspect-[2108/424]"
            style={{ width: stacked ? 'min(760px, 88vw)' : 'min(1180px, 78vw)' }}
          >
            <img
              ref={planeRef}
              src="/crj-xray.png"
              alt="CRJ700/900 x-ray side elevation"
              className="absolute inset-0 h-full w-full will-change-transform"
              style={{ mixBlendMode: 'screen', transform: PARALLAX_TRANSFORM }}
            />

            {/* Under the same transform as the image: the dimension has to
                keep measuring the thing it points at. */}
            <div className="absolute inset-0 will-change-transform" style={{ transform: PARALLAX_TRANSFORM }}>
              <AirframeNotes detail={detail} />
            </div>

            <div aria-hidden="true" className="absolute inset-0 will-change-transform" style={{ transform: PARALLAX_TRANSFORM }}>
              {CARD_META.map((meta, i) => {
                const a = `var(--a${i + 1}, 0)`;
                const line = leaderLine(meta, stacked);
                return (
                  <div key={role.callouts[i].station}>
                    <div
                      className="absolute w-px"
                      style={{
                        left: `${meta.dotLeft}%`,
                        top: line.top,
                        height: line.height,
                        transformOrigin: `${line.origin} center`,
                        background: `linear-gradient(${line.origin === 'top' ? 180 : 0}deg, #f0a02a, rgba(240,160,42,0.25))`,
                        transform: `scaleY(${a})`,
                      }}
                    />
                    <div
                      className="absolute -ml-1 -mt-1 h-[9px] w-[9px] rounded-full border border-amber-signal bg-[rgba(240,160,42,0.28)]"
                      style={{ left: `${meta.dotLeft}%`, top: `${meta.dotTop}%`, opacity: a, transform: `scale(calc(0.4 + ${a} * 0.6))` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Same transform as the image and its overlay above, so each card's
                corner stays exactly where its leader line ends regardless of
                scroll-driven parallax. */}
            <div className="absolute inset-0" style={{ transform: PARALLAX_TRANSFORM }}>
              {role.callouts.map((callout, i) => {
                const meta = CARD_META[i];
                const a = `var(--a${i + 1}, 0)`;
                return (
                  <div
                    key={callout.station}
                    data-card-index={i}
                    className="absolute z-[3] box-border"
                    style={{
                      ...cardPositionStyle(i, stacked),
                      opacity: a,
                      transform: `translate3d(calc((1 - ${a}) * ${meta.slide.x}px), calc((1 - ${a}) * ${meta.slide.y}px), 0)`,
                    }}
                  >
                    <HudCard callout={callout} index={i} revealed={cardRevealed[i]} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          ref={hudRef}
          className="pointer-events-none absolute left-8 right-8 top-[30px] flex items-start justify-between gap-6 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim md:text-[10px] md:tracking-[0.2em]"
        >
          <div className="flex flex-col gap-2" style={{ opacity: 'calc(1.1 - var(--sp, 0) * 12)' }}>
            <div className="whitespace-nowrap text-accent-text">§ 01 · Experience</div>
            {/* The aircraft itself is named in the spec block opposite. */}
            <div className="whitespace-nowrap">Side elevation · sheet 01</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-ink">{phase}</div>
            <div className="flex items-center gap-2.5">
              <div className="h-0.5 w-20 overflow-hidden bg-border md:w-32">
                <div className="h-full origin-left bg-amber-signal" style={{ transform: `scaleX(${readout / 100})` }} />
              </div>
              <span className="inline-block w-9 text-right">{String(readout).padStart(2, '0')}%</span>
            </div>
            {showSpec && <SpecBlock />}
          </div>
        </div>

        {/* --sheet clears the drafting furniture as the survey ends, so the
            airframe departs from an empty sheet and Projects arrives on one. */}
        {/* Absolute, not a plain block: the stage is a centring flex row, and
            an in-flow wrapper here would shift the plate group off centre. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: 'var(--sheet, 1)' }}
        >
          <SheetMarks detail={detail} />
        </div>

        {/* Below md the NavRail is a fixed bottom bar, so the band lifts clear
            of it, and the two halves are allowed to wrap onto their own rows
            rather than crushing each other.

            Deliberately outside the --sheet clear-out. The two halves that are
            scroll prompts (the dates line and "scroll to survey") fade on
            their own against --sp long before the departure; what is left is
            the title block and the education line, which name whose work this
            was. Those are the section's content, not drafting furniture, so
            they stay legible under the departing aircraft and leave with the
            stage rather than dissolving off it. */}
        <div className="pointer-events-none absolute bottom-[52px] left-8 right-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:bottom-[26px]">
          {/* Holds its natural width from md up, where the education line
              beside it has room to give; below that it has to be able to
              shrink or the company name runs off the sheet. */}
          <div className="min-w-0 shrink md:shrink-0">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim"
              style={{ opacity: `calc(1.15 - var(--sp, 0) * ${footfade})` }}
            >
              {role.start} – {role.end} · {role.location}
            </div>
            {/* Title block. Like the one on a real drawing it names the owner
                and never leaves the sheet, so unlike the dates line above it
                this does not fade as the survey runs. */}
            <div ref={titleBlockRef} className="mt-[9px] flex items-center gap-3">
              {role.logo && (
                <img
                  src={role.logo}
                  alt=""
                  className="h-[26px] w-auto shrink-0 md:h-[30px]"
                  // The mark ships as dark navy on transparent, which is
                  // invisible here; flatten it to the sheet's ink instead.
                  style={{ filter: 'brightness(0) invert(1)', opacity: 0.88 }}
                />
              )}
              <span aria-hidden="true" className="h-[30px] w-px shrink-0 bg-[rgba(96,128,180,0.38)] md:h-[32px]" />
              <div className="min-w-0">
                {/* The company name is 27 characters; below sm it has to be
                    allowed to wrap or it runs off the sheet. */}
                <div className="font-display text-[18px] font-semibold leading-[1.12] text-ink sm:whitespace-nowrap sm:text-[22px] md:text-[26px]">
                  {role.company}
                </div>
                <div className="mt-[6px] text-[12.5px] leading-none text-ink-dim md:text-[13px]">{role.role}</div>
              </div>
            </div>
          </div>
          <div className="min-w-0 grow text-right font-mono text-[9px] uppercase tracking-[0.2em] text-ink-dim">
            <div style={{ opacity: `calc(1.15 - var(--sp, 0) * ${footfade})` }}>
              <span className="text-amber-signal motion-safe:animate-pulse">↓ scroll to survey</span>
            </div>
            <div className="mt-[7px]">
              {education.program}, {education.school} · {education.graduation}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
