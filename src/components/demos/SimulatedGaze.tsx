import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { useReducedMotionPref } from '../../lib/motion';
import { TARGETS, cellAt, type Point } from './gaze';

/*
 * The simulated eye-tracking demo, and the demo area it shares with the live
 * one (EyeDemo). Exports:
 *   - `SimulatedGaze` (named and default): the scripted playback. No props.
 *   - `GazeField`, `placeReticle`, `useOnScreen`, `PIPELINE_CAPTION`: shared
 *     with EyeDemo so both demos draw the same area.
 */

/** The pipeline as the site has always described it. */
export const PIPELINE_CAPTION = 'Webcam → iris landmarks → smoothed gaze → cursor + click';

// ── Shared: visibility gate ─────────────────────────────────────────────────

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/**
 * True while the element is on screen and the tab is visible: the only time a
 * demo's rAF loop may run (DESIGN.md §4.5, "offscreen is paused").
 */
export function useOnScreen(ref: RefObject<Element>): boolean {
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) setInView(e.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  const docVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== 'hidden',
    () => false,
  );
  return inView && docVisible;
}

// ── Shared: the demo area ───────────────────────────────────────────────────

/**
 * Move the reticle (the element passed to GazeField's `reticleRef`) to a point
 * in demo-area coordinates, or hide it with null. Written straight to the DOM
 * from rAF loops, so tracking never re-renders React. The wrapper fills the
 * area, so translating it by x·100% moves the reticle by x of the area's width.
 */
export function placeReticle(el: HTMLElement | null, p: Point | null, blink?: boolean) {
  if (!el) return;
  if (!p) {
    el.style.visibility = 'hidden';
    return;
  }
  el.style.visibility = 'visible';
  el.style.transform = `translate(${(p.x * 100).toFixed(3)}%, ${(p.y * 100).toFixed(3)}%)`;
  if (blink !== undefined) el.dataset.blink = String(blink);
}

function targetClass(done: boolean, highlighted: boolean, reduced: boolean) {
  const base =
    'relative flex h-12 w-12 items-center justify-center rounded-full font-mono text-label' +
    (reduced ? '' : ' transition-colors duration-quick');
  // Red means markup: a selected target is marked in redline.
  if (done) return `${base} border-2 border-redline bg-redline text-cyanotype`;
  if (highlighted) return `${base} border-2 border-blueprint bg-blueprint/15 text-blueprint`;
  return `${base} border border-faded/70 bg-cyanotype text-faded`;
}

interface GazeFieldProps {
  /** Accessible name of the area. */
  label: string;
  /** Id of an element describing what's happening in the area. */
  descriptionId?: string;
  /** Selected state of the nine targets (TARGETS order). */
  done: ReadonlyArray<boolean>;
  /** The target under the reticle. */
  highlighted: number | null;
  /** When given, targets are toggle buttons (click, tap, Enter, Space). Otherwise they are drawn only. */
  onToggle?: (index: number) => void;
  showTargets?: boolean;
  /** When given, the reticle is drawn and this ref receives its wrapper (see placeReticle). */
  reticleRef?: Ref<HTMLDivElement>;
  reduced: boolean;
  fieldRef?: Ref<HTMLDivElement>;
  /** Overlays, e.g. the calibration dot. */
  children?: ReactNode;
}

/**
 * The demo area: a framed 3×3 field of targets (zones A1–C3), a construction
 * grid, and the reticle. Square frame; only the round things are round.
 */
export function GazeField({
  label,
  descriptionId,
  done,
  highlighted,
  onToggle,
  showTargets = true,
  reticleRef,
  reduced,
  fieldRef,
  children,
}: GazeFieldProps) {
  return (
    <div
      ref={fieldRef}
      role="group"
      aria-label={label}
      aria-describedby={descriptionId}
      tabIndex={-1}
      className="ground relative aspect-[4/3] w-full overflow-hidden border-2 border-blueprint sm:aspect-[16/10]"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 300 300"
        preserveAspectRatio="none"
      >
        {['M100 0V300', 'M200 0V300', 'M0 100H300', 'M0 200H300'].map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            className="stroke-construction"
            strokeWidth={1}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {showTargets && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden={onToggle ? undefined : true}>
          {TARGETS.map((t, i) => (
            <div key={t.id} className="flex items-center justify-center">
              {onToggle ? (
                <button
                  type="button"
                  aria-pressed={done[i]}
                  aria-label={`Target ${t.id}`}
                  onClick={() => onToggle(i)}
                  className={targetClass(done[i], highlighted === i, reduced)}
                >
                  {t.id}
                </button>
              ) : (
                <span className={targetClass(done[i], highlighted === i, reduced)}>{t.id}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {children}

      {reticleRef && (
        <div
          ref={reticleRef}
          aria-hidden="true"
          data-blink="false"
          className="pointer-events-none invisible absolute inset-0 text-blueprint data-[blink=true]:text-redline"
        >
          <svg
            className="absolute left-0 top-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 overflow-visible"
            viewBox="-28 -28 56 56"
            fill="none"
            stroke="currentColor"
          >
            <circle r="17" strokeWidth="2" />
            <path d="M0 -27V-20M0 20V27M-27 0H-20M20 0H27" strokeWidth="2" />
            <circle r="2.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── The simulation ──────────────────────────────────────────────────────────

/** The scripted visiting order: corners, centre, then edges (A1 A3 C3 C1 B2 A2 B3 C2 B1). */
const SCRIPT = [0, 2, 8, 6, 4, 1, 5, 7, 3] as const;
const TRAVEL_MS = 700;
const DWELL_MS = 450;
const BLINK_MS = 180;
const SEGMENT_MS = TRAVEL_MS + DWELL_MS + BLINK_MS;
const HOLD_MS = 1600;

/** Close to the site's ease-pen (0.65, 0, 0.35, 1): accelerate, then settle. */
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** A small, smooth wander, like smoothed gaze never holds perfectly still. */
function tremor(ms: number): Point {
  const s = ms / 1000;
  return {
    x: 0.011 * Math.sin(s * 8.2) + 0.006 * Math.sin(s * 19.5 + 1.3),
    y: 0.009 * Math.sin(s * 6.9 + 0.7) + 0.005 * Math.sin(s * 23.1 + 2.1),
  };
}

/** Where the scripted gaze is `t` ms into segment `k` (k targets already selected). */
function scriptedGaze(k: number, t: number, clockMs: number): { p: Point; blink: boolean } {
  const w = tremor(clockMs);
  if (k >= SCRIPT.length) {
    const last = TARGETS[SCRIPT[SCRIPT.length - 1]];
    return { p: { x: last.x + w.x, y: last.y + w.y }, blink: false };
  }
  const to = TARGETS[SCRIPT[k]];
  const from = TARGETS[SCRIPT[k === 0 ? SCRIPT.length - 1 : k - 1]];
  const s = t < TRAVEL_MS ? easeInOutCubic(t / TRAVEL_MS) : 1;
  return {
    p: { x: from.x + (to.x - from.x) * s + w.x, y: from.y + (to.y - from.y) * s + w.y },
    blink: t >= TRAVEL_MS + DWELL_MS,
  };
}

/** The target the reticle rests on after `step` selections. */
const restingTarget = (step: number) => SCRIPT[Math.min(step, SCRIPT.length - 1)];

function stepMessage(step: number) {
  if (step === 0) return `Reticle on ${TARGETS[SCRIPT[0]].id}. Step to blink and select it.`;
  if (step >= SCRIPT.length) return 'All nine targets selected. Step to start again.';
  return `Blink selected ${TARGETS[SCRIPT[step - 1]].id}. Reticle now on ${TARGETS[SCRIPT[step]].id}.`;
}

/**
 * The eye-tracking demo with no camera: the same demo area, with a scripted
 * reticle that visits each target and blink-clicks it. Runs on
 * requestAnimationFrame only while on screen and the tab is visible, and can
 * be paused. Under reduced motion it is a still drawing plus a Step button
 * that advances it by hand.
 */
export function SimulatedGaze() {
  const reduced = useReducedMotionPref();
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [highlighted, setHighlighted] = useState<number>(SCRIPT[0]);
  const rootRef = useRef<HTMLElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const timeline = useRef({ k: 0, t: 0, clock: 0 });
  const visible = useOnScreen(rootRef);
  const descriptionId = useId();
  const animating = !reduced && playing;

  useEffect(() => {
    if (!animating || !visible) return;
    let raf = 0;
    let last: number | null = null;
    let shown = -1;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last === null ? 0 : Math.min(now - last, 64);
      last = now;
      const tl = timeline.current;
      tl.clock += dt;
      tl.t += dt;
      if (tl.k < SCRIPT.length && tl.t >= SEGMENT_MS) {
        tl.t -= SEGMENT_MS;
        tl.k += 1;
        setStep(tl.k);
      } else if (tl.k >= SCRIPT.length && tl.t >= HOLD_MS) {
        tl.t = 0;
        tl.k = 0;
        setStep(0);
      }
      const { p, blink } = scriptedGaze(tl.k, tl.t, tl.clock);
      placeReticle(reticleRef.current, p, blink);
      const cell = cellAt(p);
      if (cell !== shown) {
        shown = cell;
        setHighlighted(cell);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animating, visible]);

  // Still (reduced motion or paused): the reticle rests on the next target.
  useLayoutEffect(() => {
    if (animating) return;
    placeReticle(reticleRef.current, TARGETS[restingTarget(step)], false);
  }, [animating, step]);

  const togglePlaying = () => {
    const tl = timeline.current;
    // Pausing snaps to the target the reticle was heading for; resuming dwells there first.
    if (playing) tl.t = tl.k < SCRIPT.length ? TRAVEL_MS : 0;
    setPlaying(!playing);
  };

  const stepOnce = () => {
    const next = step >= SCRIPT.length ? 0 : step + 1;
    timeline.current.k = next;
    timeline.current.t = next < SCRIPT.length ? TRAVEL_MS : 0;
    setStep(next);
  };

  const done = TARGETS.map((_, i) => SCRIPT.slice(0, step).some((s) => s === i));
  const shownHighlight = animating ? highlighted : restingTarget(step);

  return (
    <figure ref={rootRef}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="lettering inline-flex items-center border border-redline px-2 py-1 text-label font-medium text-redline">
          Simulation: no camera in use
        </p>
        <div className="flex flex-wrap gap-3">
          {!reduced && (
            <button type="button" className="btn-secondary" onClick={togglePlaying}>
              {playing ? 'Pause simulation' : 'Play simulation'}
            </button>
          )}
          {!animating && (
            <button type="button" className="btn-secondary" onClick={stepOnce}>
              Step
            </button>
          )}
        </div>
      </div>

      <p id={descriptionId} className="sr-only">
        A scripted playback, not your eyes: a reticle moves across nine targets in a three-by-three grid, A1 at top
        left to C3 at bottom right, and a blink selects each one. {step} of 9 selected.
      </p>
      <GazeField
        label="Simulated eye-tracking targets"
        descriptionId={descriptionId}
        done={done}
        highlighted={shownHighlight}
        reticleRef={reticleRef}
        reduced={reduced}
      />

      <p role="status" className={animating ? 'sr-only' : 'mt-3 text-small text-blueprint'}>
        {animating ? '' : stepMessage(step)}
      </p>
      <figcaption className="mt-3 text-small text-faded">{PIPELINE_CAPTION}</figcaption>
    </figure>
  );
}

export default SimulatedGaze;
