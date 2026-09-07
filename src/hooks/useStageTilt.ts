import { useEffect, useRef } from 'react';
import { computeParallaxOffset } from '../utils/parallax';

// The stage is authored at a fixed 900x760 and then scaled to fit whatever
// box it lands in, so every coordinate inside it (SVG connectors, panel
// offsets) can stay a plain number instead of a percentage. The fit divisor
// is deliberately larger than the stage itself — the panels overhang their
// container and the extra margin keeps that overhang from being clipped.
const FIT_WIDTH = 940;
const FIT_HEIGHT = 800;

// Floor low enough that narrow viewports shrink the scene rather than
// overflowing it; ceiling just past 1 so very wide screens get a little
// more presence without the 10px type going soft.
const MIN_FIT = 0.4;
const MAX_FIT = 1.05;

// Per-frame approach rate for the pointer lerp. Low enough that the stage
// glides after the cursor instead of snapping to it.
const EASE = 0.07;

/**
 * Wires up the hero's 3D stage: a pointer-following tilt and an
 * auto-fit scale.
 *
 * Returns three refs the caller must attach — `section` is the pointer
 * surface (the tilt tracks across the whole hero, not just the stage),
 * `box` is the element that gets `--fit`, and `stage` is the transformed
 * element that gets `--mx` / `--my`.
 *
 * Both custom properties are written straight to the node rather than held
 * in state: they update every frame, and re-rendering a scene this large at
 * 60fps would be the one thing that makes it stutter.
 */
export function useStageTilt() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Fit is a layout concern, not motion — it stays on under
  // prefers-reduced-motion, or the scene would overflow on small screens.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const fit = () => {
      const { clientWidth: width, clientHeight: height } = box;
      if (!width || !height) return;
      const scale = Math.min(width / FIT_WIDTH, height / FIT_HEIGHT);
      box.style.setProperty('--fit', Math.max(MIN_FIT, Math.min(MAX_FIT, scale)).toFixed(3));
    };

    fit();

    // jsdom has no ResizeObserver, so the tests exercise the resize path only.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(fit);
    observer?.observe(box);
    window.addEventListener('resize', fit);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const handleMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Pointer position as -1..1 from the section's centre, clamped so a
      // pointer that leaves the box mid-drag can't overdrive the rotation.
      const offset = computeParallaxOffset(
        {
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
        },
        1,
      );
      target.x = offset.x;
      target.y = offset.y;
    };

    const handleLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    section.addEventListener('pointermove', handleMove);
    section.addEventListener('pointerleave', handleLeave);

    let frame = requestAnimationFrame(function tick() {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      stage.style.setProperty('--mx', current.x.toFixed(4));
      stage.style.setProperty('--my', current.y.toFixed(4));
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener('pointermove', handleMove);
      section.removeEventListener('pointerleave', handleLeave);
    };
  }, []);

  return { sectionRef, boxRef, stageRef };
}
