import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { ease } from '../../lib/motion';
import { useReducedMotionPref } from '../../lib/motion';

const KEY = 'intro-plotted';
const DRAW = 0.7;
const HOLD = 0.15;
const FADE = 0.25;

/**
 * First visit per session: the plotter inks the drawing set's frame (border,
 * zone rule, title-block rule) over the already visible cover in under a
 * second, then lifts away. Pointer-events none, so nothing waits for it; any
 * key, click, wheel or touch finishes it at once. Never under reduced motion,
 * never in the prerendered HTML, and it never hides the name.
 */
export function Intro() {
  const reduced = useReducedMotionPref();
  const [frame, setFrame] = useState<{ left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (reduced) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
      sessionStorage.setItem(KEY, '1');
    } catch {
      seen = false;
    }
    const set = document.querySelector('.drawing-set');
    if (seen || scrollY > 0 || !set) return;
    const r = set.getBoundingClientRect();
    const start = requestAnimationFrame(() => setFrame({ left: r.left, width: r.width, height: innerHeight }));
    const end = () => setFrame(null);
    const t = window.setTimeout(end, (DRAW + HOLD + FADE) * 1000);
    const events = ['keydown', 'pointerdown', 'wheel', 'touchstart'] as const;
    events.forEach((ev) => addEventListener(ev, end, { once: true, passive: true }));
    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(t);
      events.forEach((ev) => removeEventListener(ev, end));
    };
  }, [reduced]);

  if (!frame) return null;
  const draw = { duration: DRAW, ease: ease.pen };
  return (
    <m.svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: DRAW + HOLD, duration: FADE }}
    >
      <m.rect
        x={frame.left + 1}
        y={1}
        width={frame.width - 2}
        height={frame.height - 2}
        fill="none"
        stroke="rgb(var(--c-blueprint))"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={draw}
      />
      <m.line
        x1={frame.left}
        x2={frame.left + frame.width}
        y1={24}
        y2={24}
        stroke="rgb(var(--c-redline))"
        strokeWidth={1.5}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...draw, delay: 0.12 }}
      />
    </m.svg>
  );
}
