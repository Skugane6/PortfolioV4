import { describe, expect, it } from 'vitest';
import pkg from '../../../package.json';
import {
  CALIBRATION_POINTS,
  EYES,
  MEDIAPIPE_VERSION,
  TARGETS,
  WASM_BASE_URL,
  blendshapeScore,
  blinkDetector,
  calibrate,
  cellAt,
  eyeRatio,
  irisRatio,
  ratioSpread,
  smooth,
  type CalibrationSample,
  type EyeIndices,
  type LandmarkPoint,
  type Point,
} from './gaze';

// ── Synthetic Face Landmarker output ────────────────────────────────────────
// 478 points, all at the origin except the ones the gaze maths reads. The two
// eyes sit level, 0.10 wide and 0.04 tall (lid to lid), like a face filling the
// middle of a 4:3 frame. `look` moves both irises the way real eyes move: in
// the image, both shift the same way (one toward its outer corner, the other
// toward its inner corner).

type Eye = Readonly<EyeIndices>;

function face(look: Point = { x: 0.5, y: 0.5 }, roll = 0): LandmarkPoint[] {
  const pts: LandmarkPoint[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
  const place = (eye: Eye, cx: number) => {
    // `from` is the image-left corner and `to` the image-right one (EYES).
    pts[eye.from] = { x: cx - 0.05, y: 0.4 };
    pts[eye.to] = { x: cx + 0.05, y: 0.4 };
    pts[eye.upper] = { x: cx, y: 0.38 };
    pts[eye.lower] = { x: cx, y: 0.42 };
    pts[eye.iris] = { x: cx - 0.05 + 0.1 * look.x, y: 0.38 + 0.04 * look.y };
  };
  place(EYES.right, 0.35);
  place(EYES.left, 0.65);
  if (roll === 0) return pts;
  // Tilt the whole head about the point between the eyes.
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  return pts.map(({ x, y }) => {
    const dx = x - 0.5;
    const dy = y - 0.4;
    return { x: 0.5 + dx * c - dy * s, y: 0.4 + dx * s + dy * c };
  });
}

describe('landmark indices', () => {
  it('uses the iris centres and eye contours MediaPipe documents', () => {
    // FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE / _LEFT_EYE in @mediapipe/tasks-vision:
    // the subject's right eye is 33/133/159/145 around iris 468 (469–472),
    // the left eye is 362/263/386/374 around iris 473 (474–477).
    expect(EYES.right).toEqual({ iris: 468, from: 33, to: 133, upper: 159, lower: 145 });
    expect(EYES.left).toEqual({ iris: 473, from: 362, to: 263, upper: 386, lower: 374 });
  });
});

describe('irisRatio', () => {
  it('puts a centred iris at 0.5 on both axes', () => {
    const r = irisRatio(face())!;
    expect(r.x).toBeCloseTo(0.5, 5);
    expect(r.y).toBeCloseTo(0.5, 5);
  });

  it('reads 0 when both irises are at the image-left corners and 1 at the image-right corners', () => {
    expect(irisRatio(face({ x: 0, y: 0.5 }))!.x).toBeCloseTo(0, 5);
    expect(irisRatio(face({ x: 1, y: 0.5 }))!.x).toBeCloseTo(1, 5);
  });

  it('maps each outer corner to the right end of the axis', () => {
    // Right eye: its outer corner (33) is image-left, so an iris there reads 0.
    const right = face();
    right[EYES.right.iris] = { ...right[33] };
    expect(eyeRatio(right, EYES.right)!.x).toBeCloseTo(0, 5);
    // Left eye: its outer corner (263) is image-right, so an iris there reads 1.
    const left = face();
    left[EYES.left.iris] = { ...left[263] };
    expect(eyeRatio(left, EYES.left)!.x).toBeCloseTo(1, 5);
  });

  it('reads the lids on the vertical axis', () => {
    expect(irisRatio(face({ x: 0.5, y: 0 }))!.y).toBeCloseTo(0, 5);
    expect(irisRatio(face({ x: 0.5, y: 1 }))!.y).toBeCloseTo(1, 5);
  });

  it('is unaffected by head roll', () => {
    const r = irisRatio(face({ x: 0.2, y: 0.7 }, (20 * Math.PI) / 180))!;
    expect(r.x).toBeCloseTo(0.2, 5);
    expect(r.y).toBeCloseTo(0.7, 5);
  });

  it('clamps to 0..1', () => {
    const r = irisRatio(face({ x: 1.4, y: -0.3 }))!;
    expect(r).toEqual({ x: 1, y: 0 });
  });

  it('returns null without iris landmarks', () => {
    expect(irisRatio(face().slice(0, 468))).toBeNull();
    expect(irisRatio([])).toBeNull();
  });

  it('corrects for a non-square frame with the aspect ratio', () => {
    // A 4:3 frame squeezes x in normalised coordinates; rolled eyes then need
    // the aspect to project correctly.
    const aspect = 4 / 3;
    const roll = (15 * Math.PI) / 180;
    const pts = face({ x: 0.3, y: 0.6 }, roll).map((p) => ({ x: 0.5 + (p.x - 0.5) / aspect, y: p.y }));
    const r = irisRatio(pts, aspect)!;
    expect(r.x).toBeCloseTo(0.3, 5);
    expect(r.y).toBeCloseTo(0.6, 5);
  });
});

describe('smooth', () => {
  it('moves a fraction alpha of the way to the next point', () => {
    expect(smooth({ x: 0, y: 0 }, { x: 1, y: 0.5 }, 0.25)).toEqual({ x: 0.25, y: 0.125 });
  });

  it('passes the first sample straight through', () => {
    expect(smooth(null, { x: 0.3, y: 0.7 }, 0.2)).toEqual({ x: 0.3, y: 0.7 });
  });

  it('treats alpha 1 as no smoothing and alpha 0 as frozen', () => {
    expect(smooth({ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.8 }, 1)).toEqual({ x: 0.9, y: 0.8 });
    expect(smooth({ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.8 }, 0)).toEqual({ x: 0.1, y: 0.1 });
  });

  it('converges on a steady input', () => {
    let p: Point | null = { x: 0, y: 0 };
    for (let i = 0; i < 60; i++) p = smooth(p, { x: 0.8, y: 0.4 }, 0.25);
    expect(p!.x).toBeCloseTo(0.8, 4);
    expect(p!.y).toBeCloseTo(0.4, 4);
  });
});

describe('calibrate', () => {
  // A plausible eye: looking right moves the iris image-left (a mirrored,
  // negative slope), and the vertical range is small and offset.
  const eye = (t: Point): Point => ({ x: 0.64 - 0.28 * t.x, y: 0.36 + 0.22 * t.y });
  // Deterministic jitter of ±0.003, like real per-frame noise.
  const jitter = (i: number, k: number) => 0.003 * Math.sin(i * 12.9898 + k * 78.233);

  const samples: CalibrationSample[] = CALIBRATION_POINTS.flatMap((p, k) =>
    Array.from({ length: 15 }, (_, i) => {
      const r = eye(p);
      return { target: { x: p.x, y: p.y }, ratio: { x: r.x + jitter(i, k), y: r.y + jitter(i + 7, k) } };
    }),
  );

  it('uses a five-point pattern: the centre, then the four corners', () => {
    expect(CALIBRATION_POINTS.map(({ x, y }) => [x, y])).toEqual([
      [0.5, 0.5],
      [0.1, 0.1],
      [0.9, 0.1],
      [0.9, 0.9],
      [0.1, 0.9],
    ]);
  });

  it('maps the five training ratios back to their targets within 0.02', () => {
    const map = calibrate(samples);
    for (const p of CALIBRATION_POINTS) {
      const out = map(eye(p));
      expect(Math.abs(out.x - p.x)).toBeLessThan(0.02);
      expect(Math.abs(out.y - p.y)).toBeLessThan(0.02);
    }
  });

  it('clamps its output to 0..1', () => {
    const map = calibrate(samples);
    expect(map({ x: 0, y: 1 })).toEqual({ x: 1, y: 1 });
    expect(map({ x: 1, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('falls back to the mean target when an axis never moved', () => {
    const flat = samples.map((s) => ({ ...s, ratio: { x: 0.5, y: s.ratio.y } }));
    expect(calibrate(flat)({ x: 0.9, y: eye({ x: 0, y: 0.5 }).y }).x).toBeCloseTo(0.5, 5);
    expect(calibrate([])({ x: 0.2, y: 0.8 })).toEqual({ x: 0.5, y: 0.5 });
  });

  it('reports how far the ratios moved across the targets', () => {
    const spread = ratioSpread(samples);
    expect(spread.x).toBeCloseTo(0.28 * 0.8, 2);
    expect(spread.y).toBeCloseTo(0.22 * 0.8, 2);
    expect(ratioSpread([])).toEqual({ x: 0, y: 0 });
  });
});

describe('blinkDetector', () => {
  const closed = [
    { categoryName: 'eyeBlinkLeft', score: 0.9 },
    { categoryName: 'eyeBlinkRight', score: 0.85 },
  ];
  const open = [
    { categoryName: 'eyeBlinkLeft', score: 0.05 },
    { categoryName: 'eyeBlinkRight', score: 0.04 },
  ];

  /** Feed frames at ~30 fps: eyes closed on [start, start + ms), open otherwise. Returns the fire times. */
  function run(detector: ReturnType<typeof blinkDetector>, blinks: Array<[start: number, ms: number]>, until: number) {
    const fired: number[] = [];
    for (let t = 0; t <= until; t += 33) {
      const isClosed = blinks.some(([s, ms]) => t >= s && t < s + ms);
      if (detector.update(isClosed ? closed : open, t)) fired.push(t);
    }
    return fired;
  }

  it('fires once for a 200 ms blink', () => {
    const fired = run(blinkDetector(), [[330, 200]], 2000);
    expect(fired).toHaveLength(1);
    // Once the eyes have been shut for minMs, not before.
    expect(fired[0]).toBeGreaterThanOrEqual(330 + 120);
    expect(fired[0]).toBeLessThan(330 + 200);
  });

  it('ignores a 60 ms flicker', () => {
    expect(run(blinkDetector(), [[330, 60]], 2000)).toHaveLength(0);
  });

  it('does not fire twice within the refractory window', () => {
    // Two 200 ms blinks 100 ms apart: the second is inside 400 ms of the first.
    expect(run(blinkDetector(), [[330, 200], [630, 200]], 2000)).toHaveLength(1);
    // Well apart, both count.
    expect(run(blinkDetector(), [[330, 200], [1300, 200]], 2500)).toHaveLength(2);
  });

  it('fires once however long the eyes stay shut', () => {
    expect(run(blinkDetector(), [[100, 1500]], 2500)).toHaveLength(1);
  });

  it('needs both eyes: a wink is not a click', () => {
    const d = blinkDetector();
    const wink = [
      { categoryName: 'eyeBlinkLeft', score: 0.95 },
      { categoryName: 'eyeBlinkRight', score: 0.1 },
    ];
    let fired = 0;
    for (let t = 0; t < 1000; t += 33) if (d.update(wink, t)) fired++;
    expect(fired).toBe(0);
  });

  it('respects custom options and resets', () => {
    const d = blinkDetector({ threshold: 0.95, minMs: 50, refractoryMs: 0 });
    expect(run(d, [[100, 200]], 600)).toHaveLength(0); // 0.9 never exceeds 0.95
    const e = blinkDetector({ minMs: 50 });
    e.update(closed, 0);
    e.reset();
    expect(e.update(closed, 60)).toBe(false); // the closure restarted at 60
    expect(e.update(closed, 120)).toBe(true);
  });

  it('accepts blendshapes as a record too', () => {
    expect(blendshapeScore({ eyeBlinkLeft: 0.7 }, 'eyeBlinkLeft')).toBe(0.7);
    expect(blendshapeScore(open, 'eyeBlinkRight')).toBe(0.04);
    expect(blendshapeScore([], 'eyeBlinkRight')).toBe(0);
  });
});

describe('targets', () => {
  it('lays nine targets out as drawing zones A1–C3, row by row', () => {
    expect(TARGETS.map((t) => t.id)).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']);
    expect(TARGETS[4]).toMatchObject({ x: 0.5, y: 0.5 });
  });

  it('finds the cell under a point, clamping at the edges', () => {
    expect(cellAt({ x: 0.5, y: 0.5 })).toBe(4);
    expect(cellAt({ x: 0.05, y: 0.95 })).toBe(6);
    expect(cellAt({ x: 1, y: 0 })).toBe(2);
    expect(cellAt({ x: -0.2, y: 1.3 })).toBe(6);
  });
});

describe('CDN pin', () => {
  it('loads the WASM for exactly the installed @mediapipe/tasks-vision version', () => {
    const installed = (pkg as { dependencies: Record<string, string> }).dependencies['@mediapipe/tasks-vision'];
    expect(installed).toBe(MEDIAPIPE_VERSION);
    expect(WASM_BASE_URL).toBe(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`);
  });
});
