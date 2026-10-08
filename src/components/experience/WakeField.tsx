import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from 'react';
import {
  EMITTERS,
  advanceParticle,
  createParticle,
  emissionRate,
  particleAlpha,
  particleCap,
  type Particle,
} from './wake';

export interface WakeHandle {
  /**
   * Called once per scroll frame with the departure's engine power (0–1).
   * Thrust rather than travel: it leads the run, so by the time the airframe
   * is moving fast enough to matter it is already leaving the frame, and a
   * wake keyed to travel would only get dense once nobody can see it.
   */
  pump(thrust: number): void;
}

interface WakeFieldProps {
  /** The airframe image. Its live box is where the emitters ride. */
  planeRef: RefObject<HTMLImageElement>;
}

// Airframe speed at full thrust, as a multiple of the rendered airframe's own
// width per second. Proportional rather than a fixed px/s: the plate is ~1120
// wide on a desktop and ~340 on a phone, and a wake sized for the former
// blows clean across a phone screen in a single dense bar.
const SPEED_PER_WIDTH = 0.9;

// Streak widths are likewise sized against the airframe, so the wake stays a
// fine trace rather than turning into rope on a small plate. Floored so it
// never thins out below a visible hairline.
const REFERENCE_WIDTH = 1000;
const MIN_SIZE_SCALE = 0.6;

// A frame longer than this is a tab switch or a scroll jump, not motion; stepping
// the whole gap would spray the entire budget in one frame.
const MAX_STEP = 0.05;

// How much of a particle's own velocity its streak spans. Wake reads as a
// dash rather than a dot, which is what sells the direction of travel.
const STREAK = 0.085;

// Colour and peak opacity per kind. Exhaust carries the plume, so it is the
// brighter of the two; the vortices are meant to be read as a trace hanging
// in the air behind the wing, not as a second plume.
const INK: Record<Particle['kind'], { rgb: [number, number, number]; peak: number }> = {
  // Blueprint steel, the same ink the sheet's rules are drawn in.
  vortex: { rgb: [122, 160, 216], peak: 0.6 },
  // Amber signal, matching the callout leader lines.
  exhaust: { rgb: [240, 160, 42], peak: 0.85 },
};

export const WakeField = forwardRef<WakeHandle, WakeFieldProps>(function WakeField(
  { planeRef },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const thrustRef = useRef(0);
  const rafRef = useRef<number>();
  const lastRef = useRef(0);
  // Fractional carry-over, so a low emission rate still emits at the right
  // average instead of rounding to zero every frame.
  const debtRef = useRef(0);
  // Streak width scale, refreshed each frame from the airframe's rendered box.
  const sizeRef = useRef(1);
  // Set by the effect below and read by the handle, so `pump` can wake the
  // loop without the handle needing to close over anything the effect owns.
  const startRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stopped = false;

    // Cap the backing store at 2x: past that the fill cost doubles again for
    // no visible gain on a field of soft 2px streaks.
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (w: number, h: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      // Additive: overlapping wake brightens rather than flattening into a
      // solid shape, which is how vortex cores read on a dark sheet.
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const p of particles.current) {
        const a = particleAlpha(p);
        if (a <= 0) continue;
        const { rgb, peak } = INK[p.kind];
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(a * peak).toFixed(3)})`;
        ctx.lineWidth = p.size * sizeRef.current;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * STREAK, p.y - p.vy * STREAK);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = (now: number) => {
      if (stopped) return;
      const dt = Math.min(MAX_STEP, Math.max(0, (now - lastRef.current) / 1000));
      lastRef.current = now;

      const thrust = thrustRef.current;
      const stage = canvas.getBoundingClientRect();

      // Emitters ride the image's own box, so they pick up the parallax drift,
      // the fit scale and the departure transform without recomputing any of it.
      const plane = planeRef.current?.getBoundingClientRect();
      if (thrust > 0 && plane && plane.width > 0) {
        const cap = particleCap(window.innerWidth);
        debtRef.current += emissionRate(thrust) * dt;
        sizeRef.current = Math.max(MIN_SIZE_SCALE, Math.min(1, plane.width / REFERENCE_WIDTH));
        const speed = plane.width * SPEED_PER_WIDTH * thrust;
        while (debtRef.current >= 1) {
          debtRef.current -= 1;
          if (particles.current.length >= cap) break;
          const e = EMITTERS[(Math.random() * EMITTERS.length) | 0];
          const x = plane.left - stage.left + e.x * plane.width;
          const y = plane.top - stage.top + e.y * plane.height;
          particles.current.push(createParticle(e, x, y, speed));
        }
        if (particles.current.length >= cap) debtRef.current = 0;
      }

      let live = 0;
      for (const p of particles.current) {
        if (advanceParticle(p, dt)) particles.current[live++] = p;
      }
      particles.current.length = live;

      draw(stage.width, stage.height);

      if (thrust <= 0 && live === 0) {
        rafRef.current = undefined;
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    // Exposed via the handle below rather than polled: the wake must cost
    // nothing at all for the ~80% of the section that is the survey.
    const start = () => {
      if (rafRef.current !== undefined) return;
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    };
    startRef.current = start;

    resize();
    window.addEventListener('resize', resize);
    let ro: ResizeObserver | undefined;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    }

    return () => {
      stopped = true;
      startRef.current = undefined;
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
      particles.current.length = 0;
    };
  }, [planeRef]);

  useImperativeHandle(ref, () => ({
    pump(thrust: number) {
      thrustRef.current = thrust;
      if (thrust > 0) startRef.current?.();
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
});
