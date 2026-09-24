import { useCallback, useEffect, useId, useRef, useState } from 'react';
// Types only: erased at build time, so nothing from MediaPipe loads until start().
import type { FaceLandmarker, FaceLandmarkerOptions } from '@mediapipe/tasks-vision';
import { useReducedMotionPref } from '../../lib/motion';
import {
  CALIBRATION_POINTS,
  MODEL_URL,
  TARGETS,
  WASM_BASE_URL,
  blendshapeScore,
  blinkDetector,
  calibrate,
  cellAt,
  irisRatio,
  ratioSpread,
  smooth,
  type BlinkDetector,
  type CalibrationSample,
  type GazeMap,
  type Point,
} from './gaze';
import { GazeField, SimulatedGaze, placeReticle, useOnScreen } from './SimulatedGaze';

/*
 * FIG. 4, the eye-tracking demo. Opt-in: the idle state loads nothing. On
 * start it asks for the camera first (so a denial costs no download), then
 * imports MediaPipe Tasks Vision, fetches the WASM runtime from jsDelivr (at
 * the installed version) and Google's Face Landmarker model, calibrates on
 * five points and lets a blink select targets. Every failure ends in the
 * simulated demo with a plain reason. Default export, no props.
 */

type Phase = 'idle' | 'requesting' | 'loading' | 'calibrating' | 'playing' | 'fallback' | 'simulation';
type FallbackKind = 'denied' | 'noCamera' | 'camera' | 'model';
type FaceState = 'searching' | 'found' | 'lost';

const SIMULATION = "so here's a simulation of the same pipeline.";

const COPY = {
  requesting: 'Asking for camera permission…',
  loading: 'Loading the face model…',
  hold: 'Keep looking at the dot until its ring fills.',
  playing: 'Calibrated. Look at a target and blink firmly to select it, or click it.',
  weak: "Calibrated, but your eyes barely moved between the dots, so the reticle will be rough. Try Recalibrate, moving only your eyes.",
  allDone: 'All nine targets selected.',
  stopped: 'Camera stopped.',
  cancelled: 'Cancelled. The camera was not started.',
  denied: `Camera permission was denied, ${SIMULATION}`,
  noCamera: `No camera was found, ${SIMULATION}`,
  cameraBusy: `The camera couldn't start (another app may be using it), ${SIMULATION}`,
  camera: (reason: string) => `The camera couldn't start (${reason}), ${SIMULATION}`,
  model: (reason: string) => `The face model couldn't load (${reason}), ${SIMULATION}`,
  crashed: (reason: string) => `The face model stopped running (${reason}), ${SIMULATION}`,
} as const;

const CAMERA_CONSTRAINTS: MediaStreamConstraints = { video: { facingMode: 'user', width: 640, height: 480 } };
/** Frames of iris ratio recorded per calibration dot. */
const SAMPLES_PER_POINT = 15;
/** Time to look back at the dot after pressing Next, before recording. */
const SETTLE_MS = 500;
/** Gaze smoothing: at ~30 detections a second, a time constant of about 130 ms. */
const GAZE_ALPHA = 0.25;
/** Both eyeBlink scores above this: the eyes are shut, so the iris can't be read. */
const EYES_SHUT = 0.5;
/** A blink selects the target that was under the reticle this long before it registered (the lids move the iris reading as they close). */
const BLINK_LOOKBACK_MS = 250;
const NO_FACE_MS = 1500;
const RING = 2 * Math.PI * 20;
const PRIVACY_URL = 'https://developers.google.com/edge/mediapipe/solutions/tasks#mediapipe_tasks_privacy_notice';

function errorName(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err && typeof err.name === 'string') return err.name;
  return '';
}

/** A few words on why something failed, for inside parentheses. */
export function shortReason(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (/failed to fetch|networkerror|load failed|network|dynamically imported module|importing a module script/i.test(msg))
    return 'a network error';
  if (/webassembly|wasm/i.test(msg)) return "WebAssembly couldn't start";
  const first = msg.split(/[.\n]/)[0].trim();
  if (!first) return 'an unknown error';
  return first.length > 60 ? `${first.slice(0, 57)}…` : first;
}

function cameraFailure(err: unknown): { kind: FallbackKind; message: string } {
  switch (errorName(err)) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return { kind: 'denied', message: COPY.denied };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return { kind: 'noCamera', message: COPY.noCamera };
    case 'NotReadableError':
    case 'TrackStartError':
      return { kind: 'camera', message: COPY.cameraBusy };
    default:
      return { kind: 'camera', message: COPY.camera(shortReason(err)) };
  }
}

async function createLandmarker(
  FL: typeof FaceLandmarker,
  fileset: Parameters<typeof FaceLandmarker.createFromOptions>[0],
): Promise<FaceLandmarker> {
  const options = (delegate: 'GPU' | 'CPU'): FaceLandmarkerOptions => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO',
    outputFaceBlendshapes: true,
    numFaces: 1,
  });
  try {
    return await FL.createFromOptions(fileset, options('GPU'));
  } catch {
    // No WebGL2, or the GPU backend failed to start: the CPU path is slower but works everywhere.
    return await FL.createFromOptions(fileset, options('CPU'));
  }
}

function safePlay(video: HTMLVideoElement) {
  try {
    const p = video.play() as Promise<void> | undefined;
    p?.catch?.(() => {});
  } catch {
    // Autoplay refused or not implemented: the stream still feeds detection once playing.
  }
}

function calibrationPrompt(i: number) {
  const where = `Point ${i + 1} of ${CALIBRATION_POINTS.length}: look at the dot in ${CALIBRATION_POINTS[i].name}, then press Space or tap Next.`;
  return i === 0 ? `${where} Keep your head still and move only your eyes.` : where;
}

interface Live {
  phase: Phase;
  calPoint: number;
  collecting: boolean;
  settleUntil: number;
  count: number;
  samples: CalibrationSample[];
  map: GazeMap | null;
  gaze: Point | null;
  highlighted: number | null;
  history: Array<{ t: number; cell: number }>;
  blink: BlinkDetector;
  face: FaceState;
  lastFace: number;
  done: boolean[];
  flash: number;
}

const freshLive = (): Live => ({
  phase: 'idle',
  calPoint: 0,
  collecting: false,
  settleUntil: 0,
  count: 0,
  samples: [],
  map: null,
  gaze: null,
  highlighted: null,
  history: [],
  blink: blinkDetector(),
  face: 'searching',
  lastFace: 0,
  done: Array<boolean>(9).fill(false),
  flash: 0,
});

export default function EyeDemo() {
  const reduced = useReducedMotionPref();
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState<{ text: string; tone: 'info' | 'alert' }>({ text: '', tone: 'info' });
  const [fallbackKind, setFallbackKind] = useState<FallbackKind | null>(null);
  const [calPoint, setCalPoint] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const [done, setDone] = useState<boolean[]>(() => Array<boolean>(9).fill(false));
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [face, setFace] = useState<FaceState>('searching');

  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const simRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);

  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  /** Bumped by every start, stop and unmount: async work from an older run is dropped. */
  const runRef = useRef(0);
  /** Per-frame state for the detection loop, kept out of React. */
  const live = useRef<Live>(freshLive());

  const onScreen = useOnScreen(rootRef);
  const descriptionId = useId();
  const reasonId = useId();

  const announce = useCallback((text: string, tone: 'info' | 'alert' = 'info') => setStatus({ text, tone }), []);

  const enter = useCallback((next: Phase) => {
    live.current.phase = next;
    setPhase(next);
  }, []);

  /** Turn the camera light off and free the model. Safe to call any number of times. */
  const release = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((t) => t.stop());
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    const landmarker = landmarkerRef.current;
    landmarkerRef.current = null;
    try {
      landmarker?.close();
    } catch {
      // Already closed.
    }
    window.clearTimeout(live.current.flash);
  }, []);

  const fallBack = useCallback(
    (kind: FallbackKind, message: string) => {
      release();
      setFallbackKind(kind);
      enter('fallback');
      announce(message, 'alert');
    },
    [announce, enter, release],
  );

  const beginCalibration = useCallback(() => {
    const l = live.current;
    l.calPoint = 0;
    l.collecting = false;
    l.count = 0;
    l.samples = [];
    l.map = null;
    l.gaze = null;
    l.highlighted = null;
    l.history = [];
    l.lastFace = performance.now();
    setCalPoint(0);
    setCollecting(false);
    setHighlighted(null);
    enter('calibrating');
    announce(calibrationPrompt(0));
  }, [announce, enter]);

  const start = useCallback(async () => {
    interacted.current = true;
    release();
    const run = ++runRef.current;
    const stale = () => run !== runRef.current;
    live.current = freshLive();
    setDone(live.current.done);
    setHighlighted(null);
    setFace('searching');
    setFallbackKind(null);
    enter('requesting');
    announce(COPY.requesting);

    if (!navigator.mediaDevices?.getUserMedia) {
      fallBack('noCamera', COPY.noCamera);
      return;
    }

    // 1. The camera, before any download: a denial costs the visitor nothing.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    } catch (err) {
      if (stale()) return;
      const { kind, message } = cameraFailure(err);
      fallBack(kind, message);
      return;
    }
    if (stale()) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;
    enter('loading');
    announce(COPY.loading);

    // 2. MediaPipe: the JS chunk, then the WASM runtime and the model.
    try {
      const { FilesetResolver, FaceLandmarker: FL } = await import('@mediapipe/tasks-vision');
      if (stale()) return;
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      if (stale()) return;
      const landmarker = await createLandmarker(FL, fileset);
      if (stale()) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
    } catch (err) {
      if (stale()) return;
      fallBack('model', COPY.model(shortReason(err)));
      return;
    }

    // 3. Calibrate.
    beginCalibration();
  }, [announce, beginCalibration, enter, fallBack, release]);

  const stop = useCallback(() => {
    interacted.current = true;
    const wasAsking = live.current.phase === 'requesting';
    runRef.current++;
    release();
    enter('idle');
    announce(wasAsking ? COPY.cancelled : COPY.stopped);
  }, [announce, enter, release]);

  const watchSimulation = () => {
    interacted.current = true;
    announce('');
    enter('simulation');
  };

  const backToStart = () => {
    announce('');
    enter('idle');
  };

  const beginCollect = useCallback(() => {
    const l = live.current;
    if (l.phase !== 'calibrating' || l.collecting) return;
    l.collecting = true;
    l.count = 0;
    l.settleUntil = performance.now() + SETTLE_MS;
    setCollecting(true);
    announce(COPY.hold);
  }, [announce]);

  const markDone = useCallback(
    (i: number, value: boolean, viaBlink: boolean) => {
      const l = live.current;
      if (l.done[i] === value) return;
      const next = l.done.slice();
      next[i] = value;
      l.done = next;
      setDone(next);
      const count = next.filter(Boolean).length;
      if (count === next.length) announce(COPY.allDone);
      else if (viaBlink) announce(`Blink selected ${TARGETS[i].id}. ${count} of 9 selected.`);
    },
    [announce],
  );

  const clearTargets = () => {
    const cleared = Array<boolean>(9).fill(false);
    live.current.done = cleared;
    setDone(cleared);
    announce('Targets cleared.');
  };

  // Unmount (the case-study dialog closed): drop in-flight work, camera off, model closed.
  useEffect(
    () => () => {
      runRef.current++;
      release();
    },
    [release],
  );

  // Attach the stream to the preview once the video element exists.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    safePlay(video);
  }, [phase]);

  // Focus follows the control that replaced the one just used.
  useEffect(() => {
    if (!interacted.current) return;
    if (phase === 'idle') startRef.current?.focus();
    else if (phase === 'requesting' || phase === 'loading') stopRef.current?.focus();
    else if (phase === 'calibrating') nextRef.current?.focus();
    else if (phase === 'playing') fieldRef.current?.focus();
    else if (phase === 'fallback') retryRef.current?.focus();
    else if (phase === 'simulation') simRef.current?.focus();
  }, [phase]);

  // Space records the current calibration dot (unless a control has focus and handles it itself).
  useEffect(() => {
    if (phase !== 'calibrating') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      beginCollect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, beginCollect]);

  // The detection loop: only while calibrating or playing, on screen, and the tab is visible.
  const detecting = (phase === 'calibrating' || phase === 'playing') && onScreen;
  useEffect(() => {
    if (!detecting) return;
    const video = videoRef.current;
    if (video) safePlay(video);
    let raf = 0;
    let lastVideoTime = -1;
    let errors = 0;

    const setProgress = (fraction: number) => {
      progressRef.current?.setAttribute('stroke-dashoffset', String(RING * (1 - fraction)));
    };

    const finishCalibration = () => {
      const l = live.current;
      l.map = calibrate(l.samples);
      const spread = ratioSpread(l.samples);
      l.gaze = null;
      l.highlighted = null;
      l.history = [];
      l.blink = blinkDetector();
      setHighlighted(null);
      enter('playing');
      announce(spread.x < 0.02 || spread.y < 0.01 ? COPY.weak : COPY.playing);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const v = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!v || !landmarker || v.readyState < 2 || v.videoWidth === 0) return;
      if (v.currentTime === lastVideoTime) return;
      lastVideoTime = v.currentTime;

      let result: ReturnType<FaceLandmarker['detectForVideo']>;
      try {
        result = landmarker.detectForVideo(v, now);
        errors = 0;
      } catch (err) {
        if (++errors > 10) {
          runRef.current++;
          fallBack('model', COPY.crashed(shortReason(err)));
        }
        return;
      }

      const l = live.current;
      const landmarks = result.faceLandmarks[0];
      const categories = result.faceBlendshapes[0]?.categories ?? [];
      const found = !!landmarks && landmarks.length >= 478;
      if (found) l.lastFace = now;
      const faceNow: FaceState = found ? 'found' : now - l.lastFace > NO_FACE_MS ? 'lost' : l.face;
      if (faceNow !== l.face) {
        l.face = faceNow;
        setFace(faceNow);
      }
      if (!found) {
        l.blink.reset();
        if (l.phase === 'playing') placeReticle(reticleRef.current, null);
        return;
      }

      const shut =
        blendshapeScore(categories, 'eyeBlinkLeft') > EYES_SHUT && blendshapeScore(categories, 'eyeBlinkRight') > EYES_SHUT;
      const ratio = shut ? null : irisRatio(landmarks, v.videoWidth / v.videoHeight);

      if (l.phase === 'calibrating') {
        if (!l.collecting || !ratio || now < l.settleUntil) return;
        const p = CALIBRATION_POINTS[l.calPoint];
        l.samples.push({ target: { x: p.x, y: p.y }, ratio });
        l.count += 1;
        setProgress(l.count / SAMPLES_PER_POINT);
        if (l.count < SAMPLES_PER_POINT) return;
        l.collecting = false;
        l.count = 0;
        if (l.calPoint < CALIBRATION_POINTS.length - 1) {
          l.calPoint += 1;
          setCalPoint(l.calPoint);
          setCollecting(false);
          announce(calibrationPrompt(l.calPoint));
        } else {
          finishCalibration();
        }
        return;
      }

      if (l.phase !== 'playing' || !l.map) return;
      if (ratio) {
        l.gaze = smooth(l.gaze, l.map(ratio), GAZE_ALPHA);
        placeReticle(reticleRef.current, l.gaze);
        const cell = cellAt(l.gaze);
        l.history.push({ t: now, cell });
        while (l.history.length && now - l.history[0].t > 1000) l.history.shift();
        if (cell !== l.highlighted) {
          l.highlighted = cell;
          setHighlighted(cell);
        }
      }
      if (l.blink.update(categories, now)) {
        // The target the reticle was on just before the lids started to close.
        const before = [...l.history].reverse().find((h) => h.t <= now - BLINK_LOOKBACK_MS);
        const cell = before?.cell ?? l.highlighted;
        if (cell !== null) {
          markDone(cell, true, true);
          const el = reticleRef.current;
          if (el) {
            el.dataset.blink = 'true';
            window.clearTimeout(l.flash);
            l.flash = window.setTimeout(() => {
              el.dataset.blink = 'false';
            }, 220);
          }
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // Same element throughout calibrating and playing; release() handles teardown.
      video?.pause();
    };
  }, [detecting, announce, enter, fallBack, markDone]);

  const cameraPhase = phase === 'requesting' || phase === 'loading' || phase === 'calibrating' || phase === 'playing';
  const selected = done.filter(Boolean).length;
  const point = CALIBRATION_POINTS[calPoint];

  const description =
    phase === 'playing'
      ? `Nine targets in a three-by-three grid, A1 at top left to C3 at bottom right. A reticle follows your gaze and highlights the target under it, and a blink selects it. Targets can also be selected with a click, or with Tab and Enter. ${selected} of 9 selected.`
      : phase === 'calibrating'
        ? `Calibration dot ${calPoint + 1} of ${CALIBRATION_POINTS.length}, in ${point.name}.`
        : 'The targets appear once the face model is ready and calibrated.';

  return (
    <div ref={rootRef} className="w-full max-w-[720px] text-blueprint">
      <p
        role="status"
        className={
          status.text
            ? `mb-4 text-small ${status.tone === 'alert' ? 'border-l-2 border-redline pl-3' : ''}`
            : 'sr-only'
        }
      >
        {status.text}
      </p>

      {phase === 'idle' && (
        <div>
          <p className="max-w-measure text-body">
            A browser version of the project's pipeline, built for this page. After a five-point calibration, a
            reticle follows your gaze across nine targets and a blink selects the one under it. Clicking a target or
            pressing Enter works too.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button ref={startRef} type="button" className="btn-primary" onClick={() => void start()}>
              Start the camera demo
            </button>
            <button type="button" className="btn-secondary" onClick={watchSimulation}>
              Watch a simulation instead
            </button>
          </div>
          <p className="mt-4 max-w-measure text-small text-faded">
            Runs Google's MediaPipe Face Landmarker in your browser. The video never leaves your device. About 7 MB
            downloads the first time you start it (16 MB uncompressed).
          </p>
          <p className="mt-2 max-w-measure text-small text-faded">
            The runtime comes from jsDelivr and the face model from Google. MediaPipe also sends Google usage and
            performance metrics, never the video (
            <a className="link text-blueprint" href={PRIVACY_URL} target="_blank" rel="noreferrer">
              MediaPipe privacy notice<span className="sr-only"> (opens in a new tab)</span>
            </a>
            ).
          </p>
        </div>
      )}

      {cameraPhase && (
        <div>
          <p id={descriptionId} className="sr-only">
            {description}
          </p>
          <GazeField
            label="Eye-tracking targets"
            descriptionId={descriptionId}
            done={done}
            highlighted={highlighted}
            onToggle={(i) => markDone(i, !live.current.done[i], false)}
            showTargets={phase === 'playing'}
            reticleRef={phase === 'playing' ? reticleRef : undefined}
            reduced={reduced}
            fieldRef={fieldRef}
          >
            {(phase === 'requesting' || phase === 'loading') && (
              <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-small text-faded">
                {phase === 'requesting'
                  ? 'Waiting for the camera.'
                  : 'Downloading the MediaPipe runtime and face model, then starting it on your device.'}
              </p>
            )}
            {phase === 'calibrating' && (
              <div
                key={calPoint}
                aria-hidden="true"
                className="pointer-events-none absolute h-0 w-0"
                style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              >
                <svg className="absolute -left-7 -top-7 h-14 w-14 overflow-visible" viewBox="-28 -28 56 56" fill="none">
                  <circle r="20" className="stroke-faded/60" strokeWidth="1" />
                  <circle
                    ref={progressRef}
                    r="20"
                    className="stroke-redline"
                    strokeWidth="3"
                    strokeDasharray={RING}
                    strokeDashoffset={RING}
                    transform="rotate(-90)"
                  />
                  <path d="M-13 0H13M0 -13V13" className="stroke-blueprint" strokeWidth="1" />
                  <circle r="5" className="fill-redline" />
                </svg>
              </div>
            )}
          </GazeField>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                {phase === 'calibrating' && (
                  <button
                    ref={nextRef}
                    type="button"
                    className="btn-primary"
                    aria-disabled={collecting}
                    onClick={beginCollect}
                  >
                    Next<span className="sr-only">, record point {calPoint + 1} of {CALIBRATION_POINTS.length}</span>
                  </button>
                )}
                {phase === 'playing' && (
                  <button type="button" className="btn-secondary" onClick={beginCalibration}>
                    Recalibrate
                  </button>
                )}
                {phase === 'playing' && selected > 0 && (
                  <button type="button" className="btn-secondary" onClick={clearTargets}>
                    Clear targets
                  </button>
                )}
                <button ref={stopRef} type="button" className="btn-secondary" onClick={stop}>
                  {phase === 'requesting' ? 'Cancel' : 'Stop camera'}
                </button>
              </div>
              {phase === 'playing' && (
                <p className="figures text-small text-faded">
                  <span className="text-blueprint">{selected}</span> of 9 selected
                </p>
              )}
            </div>

            <figure className="w-40 shrink-0">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                disablePictureInPicture
                className="aspect-[4/3] w-full -scale-x-100 border border-faded/60 bg-cyanotype object-cover"
              />
              <figcaption className="mt-1 text-label text-faded">Camera preview, not recorded</figcaption>
              {(phase === 'calibrating' || phase === 'playing') && (
                <p className="mt-1 text-label text-faded">
                  {face === 'found'
                    ? 'Face found'
                    : face === 'lost'
                      ? 'No face found: face the camera in even light'
                      : 'Looking for your face…'}
                </p>
              )}
            </figure>
          </div>
        </div>
      )}

      {phase === 'fallback' && (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              ref={retryRef}
              type="button"
              className="btn-secondary"
              aria-describedby={fallbackKind === 'denied' ? reasonId : undefined}
              onClick={() => void start()}
            >
              Try again
            </button>
            {fallbackKind === 'denied' && (
              <p id={reasonId} className="max-w-measure text-small text-faded">
                To use your camera, allow it for this site in your browser's settings first.
              </p>
            )}
          </div>
          <SimulatedGaze />
        </div>
      )}

      {phase === 'simulation' && (
        <div ref={simRef} tabIndex={-1} role="group" aria-label="Simulated demo">
          <SimulatedGaze />
          <button type="button" className="btn-secondary mt-5" onClick={backToStart}>
            Back to the camera demo
          </button>
        </div>
      )}
    </div>
  );
}
