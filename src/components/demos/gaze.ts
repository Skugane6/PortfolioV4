/**
 * Gaze maths for the eye-tracking demo (FIG. 4). Pure functions only: no DOM,
 * no MediaPipe import, so it is unit-tested with synthetic landmarks and costs
 * nothing until the demo is opened.
 *
 * Pipeline: Face Landmarker landmarks → `irisRatio` (where each iris sits
 * inside its eye, 0..1 per axis) → `calibrate` (a least-squares map from that
 * ratio to the demo area, fitted on a five-point calibration) → `smooth`
 * (exponential smoothing) → the reticle. `blinkDetector` turns the
 * `eyeBlinkLeft` / `eyeBlinkRight` blendshapes into clicks.
 */

export interface Point {
  x: number;
  y: number;
}

/** A Face Landmarker landmark: x and y normalised to the frame's width and height. */
export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

/**
 * The version of `@mediapipe/tasks-vision` in package.json. The WASM comes
 * from the CDN at this exact version, so the JS glue and the binary always
 * match (gaze.test.ts fails if package.json moves without this).
 */
export const MEDIAPIPE_VERSION = '1.0.1';
export const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
/** Google's published Face Landmarker bundle (face detector, mesh with irises, blendshapes), float16 v1. */
export const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/**
 * The landmarks each eye is read from, per MediaPipe's face-mesh topology
 * (`FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE` / `_LEFT_EYE` / `_IRIS`). "Right"
 * and "left" are the subject's own: in an unmirrored camera frame the right
 * eye is on the image's left.
 *
 * `from` → `to` runs image-left → image-right across the eye, so both eyes
 * share one horizontal axis: for the right eye that is outer corner 33 to
 * inner corner 133; for the left eye, inner corner 362 to outer corner 263.
 * `upper` / `lower` are the mid-lid points, and `iris` the iris centre
 * (468 is the centre of ring 469–472; 473 of ring 474–477).
 */
export interface EyeIndices {
  iris: number;
  from: number;
  to: number;
  upper: number;
  lower: number;
}

export const EYES: Readonly<Record<'right' | 'left', Readonly<EyeIndices>>> = {
  right: { iris: 468, from: 33, to: 133, upper: 159, lower: 145 },
  left: { iris: 473, from: 362, to: 263, upper: 386, lower: 374 },
};

const LANDMARK_COUNT = 478;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Where one iris sits inside its eye, unclamped: x is 0 at the image-left
 * corner and 1 at the image-right corner (projected onto the corner-to-corner
 * axis, so a tilted head doesn't skew it); y is 0 at the upper lid and 1 at
 * the lower lid (measured perpendicular to that axis). `aspect` is the frame's
 * width / height: landmarks are normalised per axis, so x is scaled back into
 * the same units as y before projecting. Null if the eye is degenerate.
 */
export function eyeRatio(landmarks: ReadonlyArray<LandmarkPoint>, eye: EyeIndices, aspect = 1): Point | null {
  const a = landmarks[eye.from];
  const b = landmarks[eye.to];
  const up = landmarks[eye.upper];
  const lo = landmarks[eye.lower];
  const c = landmarks[eye.iris];
  if (!a || !b || !up || !lo || !c) return null;

  const ux = (b.x - a.x) * aspect;
  const uy = b.y - a.y;
  const len2 = ux * ux + uy * uy;
  if (len2 < 1e-12) return null;
  const x = ((c.x - a.x) * aspect * ux + (c.y - a.y) * uy) / len2;

  // Perpendicular to the eye axis, pointing image-down when the axis points
  // image-right (y grows downward in image coordinates).
  const vx = -uy;
  const vy = ux;
  const span = (lo.x - up.x) * aspect * vx + (lo.y - up.y) * vy;
  if (Math.abs(span) < 1e-12) return null;
  const y = ((c.x - up.x) * aspect * vx + (c.y - up.y) * vy) / span;

  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/**
 * Where the irises sit inside the eyes, averaged over both eyes and clamped to
 * 0..1 per axis (0.5, 0.5 is looking straight ahead). Null when the landmarks
 * don't include the irises (fewer than 478 points) or both eyes are degenerate.
 */
export function irisRatio(landmarks: ReadonlyArray<LandmarkPoint>, aspect = 1): Point | null {
  if (landmarks.length < LANDMARK_COUNT) return null;
  const eyes = [eyeRatio(landmarks, EYES.right, aspect), eyeRatio(landmarks, EYES.left, aspect)].filter(
    (r): r is Point => r !== null,
  );
  if (eyes.length === 0) return null;
  const x = eyes.reduce((s, r) => s + r.x, 0) / eyes.length;
  const y = eyes.reduce((s, r) => s + r.y, 0) / eyes.length;
  return { x: clamp01(x), y: clamp01(y) };
}

/**
 * Exponential smoothing: move `alpha` (0..1) of the way from `prev` to
 * `next`. 1 follows the input exactly, 0 never moves. With no previous point
 * the input passes straight through.
 */
export function smooth(prev: Point | null, next: Point, alpha: number): Point {
  if (!prev) return { x: next.x, y: next.y };
  const a = clamp01(alpha);
  return { x: prev.x + a * (next.x - prev.x), y: prev.y + a * (next.y - prev.y) };
}

// ── Calibration ─────────────────────────────────────────────────────────────

export interface CalibrationSample {
  /** Where the visitor was asked to look, in demo-area coordinates (0..1). */
  target: Point;
  /** The `irisRatio` measured while they looked there. */
  ratio: Point;
}

export type GazeMap = (ratio: Point) => Point;

/** Where the calibration dots go, in order: the centre, then the four corners (clockwise from top-left). */
export const CALIBRATION_POINTS: ReadonlyArray<Point & { name: string }> = [
  { x: 0.5, y: 0.5, name: 'the centre' },
  { x: 0.1, y: 0.1, name: 'the top-left corner' },
  { x: 0.9, y: 0.1, name: 'the top-right corner' },
  { x: 0.9, y: 0.9, name: 'the bottom-right corner' },
  { x: 0.1, y: 0.9, name: 'the bottom-left corner' },
];

/** Ordinary least squares for y = slope · x + intercept. A flat x gives slope 0 through the mean. */
function fitLine(xs: readonly number[], ys: readonly number[]): { slope: number; intercept: number } {
  const n = xs.length;
  if (n === 0) return { slope: 0, intercept: 0.5 };
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx < 1e-12) return { slope: 0, intercept: my };
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

/**
 * Fit a per-axis linear map from iris ratio to demo-area position, by least
 * squares over every calibration frame (several frames per dot). The slope may
 * be negative: in an unmirrored camera frame, looking right moves the irises
 * image-left. The returned map clamps to 0..1.
 */
export function calibrate(samples: ReadonlyArray<CalibrationSample>): GazeMap {
  const fx = fitLine(
    samples.map((s) => s.ratio.x),
    samples.map((s) => s.target.x),
  );
  const fy = fitLine(
    samples.map((s) => s.ratio.y),
    samples.map((s) => s.target.y),
  );
  return (r) => ({
    x: clamp01(fx.slope * r.x + fx.intercept),
    y: clamp01(fy.slope * r.y + fy.intercept),
  });
}

/**
 * How far the mean iris ratio moved between calibration dots, per axis. A
 * tiny spread means the eyes barely registered moving (head turned instead,
 * poor light), and the map will be noisy.
 */
export function ratioSpread(samples: ReadonlyArray<CalibrationSample>): Point {
  const byTarget = new Map<string, { x: number; y: number; n: number }>();
  for (const s of samples) {
    const key = `${s.target.x},${s.target.y}`;
    const acc = byTarget.get(key) ?? { x: 0, y: 0, n: 0 };
    acc.x += s.ratio.x;
    acc.y += s.ratio.y;
    acc.n += 1;
    byTarget.set(key, acc);
  }
  const means = [...byTarget.values()].map((a) => ({ x: a.x / a.n, y: a.y / a.n }));
  if (means.length === 0) return { x: 0, y: 0 };
  const range = (vs: number[]) => Math.max(...vs) - Math.min(...vs);
  return { x: range(means.map((m) => m.x)), y: range(means.map((m) => m.y)) };
}

// ── Blinks ──────────────────────────────────────────────────────────────────

/** Face Landmarker blendshapes: its `categories` array, or a plain name → score record. */
export type Blendshapes =
  | ReadonlyArray<{ categoryName: string; score: number }>
  | Readonly<Record<string, number>>;

export function blendshapeScore(blendshapes: Blendshapes, name: string): number {
  if (Array.isArray(blendshapes)) {
    const list = blendshapes as ReadonlyArray<{ categoryName: string; score: number }>;
    return list.find((c) => c.categoryName === name)?.score ?? 0;
  }
  return (blendshapes as Readonly<Record<string, number>>)[name] ?? 0;
}

export interface BlinkOptions {
  /** Both `eyeBlinkLeft` and `eyeBlinkRight` must exceed this (0..1). */
  threshold?: number;
  /** …for at least this long. Filters out flickers and fast involuntary blinks. */
  minMs?: number;
  /** After a click, no other click for this long. */
  refractoryMs?: number;
}

export interface BlinkDetector {
  /** Feed one frame. True on the one frame a blink becomes a click. */
  update(blendshapes: Blendshapes, nowMs: number): boolean;
  /** Forget any closure in progress (e.g. the face was lost). */
  reset(): void;
}

/**
 * Blink-to-click: fires once per blink, when both eyes have been closed past
 * `threshold` for at least `minMs`, and never within `refractoryMs` of the
 * last click. Holding the eyes shut still clicks only once. A wink (one eye)
 * never clicks.
 */
export function blinkDetector({ threshold = 0.5, minMs = 120, refractoryMs = 400 }: BlinkOptions = {}): BlinkDetector {
  let closedSince: number | null = null;
  let firedThisClosure = false;
  let lastFire = Number.NEGATIVE_INFINITY;

  return {
    update(blendshapes, nowMs) {
      const closed =
        blendshapeScore(blendshapes, 'eyeBlinkLeft') > threshold &&
        blendshapeScore(blendshapes, 'eyeBlinkRight') > threshold;
      if (!closed) {
        closedSince = null;
        firedThisClosure = false;
        return false;
      }
      if (closedSince === null) closedSince = nowMs;
      if (!firedThisClosure && nowMs - closedSince >= minMs && nowMs - lastFire >= refractoryMs) {
        firedThisClosure = true;
        lastFire = nowMs;
        return true;
      }
      return false;
    },
    reset() {
      closedSince = null;
      firedThisClosure = false;
    },
  };
}

// ── The demo area ───────────────────────────────────────────────────────────

export interface Target extends Point {
  /** Drawing-zone reference: row letter A–C top to bottom, column number 1–3 left to right. */
  id: string;
  row: number;
  col: number;
}

/** The 3×3 grid of targets, row by row, each at the centre of its cell. */
export const TARGETS: ReadonlyArray<Target> = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return { id: `${'ABC'[row]}${col + 1}`, row, col, x: (col + 0.5) / 3, y: (row + 0.5) / 3 };
});

/** Index into TARGETS of the cell containing a point (clamped to the grid). */
export function cellAt(p: Point): number {
  const col = Math.min(2, Math.max(0, Math.floor(p.x * 3)));
  const row = Math.min(2, Math.max(0, Math.floor(p.y * 3)));
  return row * 3 + col;
}
