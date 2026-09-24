import { useEffect, useRef, useState } from 'react';
import { useReducedMotionPref } from '../../lib/motion';
import { useUi } from '../../lib/ui';

/*
 * The checker: a pixel cat that lives on the cover's title-block rule. It
 * naps until someone wakes it (click, tap, Enter, or "Wake the cat" in the
 * command palette), then trots along the rule to a new spot and curls up
 * again. It looks up when a pointer comes close. It only ever occupies the
 * strip reserved for it above the title block, so it can't cover content,
 * and it holds still under reduced motion.
 *
 * Sprite art: the tuxedo oneko sheet (see public/cat/CREDITS.md).
 */

const TILE = 32;
const SCALE = 1.5;
const SIZE = TILE * SCALE;
const FRAMES = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  scratchSelf: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
} as const;
type Pose = keyof typeof FRAMES;

const SPEED = 140; // px per second
const STEP_MS = 140; // walk cycle
const NAP_MS = 700; // sleeping breath
const EASTER_CLICKS = 5;

export function Cat() {
  const reduced = useReducedMotionPref();
  const wakes = useUi((s) => s.catWake);
  const stripRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLButtonElement>(null);
  const [pose, setPose] = useState<Pose>('sleeping');
  const [frame, setFrame] = useState(0);
  const [x, setX] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const walking = useRef(false);
  const clicks = useRef<number[]>([]);
  const visible = useRef(true);

  // Start near the right end of the rule, clear of the Drawn cell's portrait.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const place = () => {
      const w = strip.clientWidth;
      setX((cur) => (cur === null ? Math.max(0, w * 0.62) : Math.min(cur, Math.max(0, w - SIZE))));
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(strip);
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(strip);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Breathing while asleep: two frames, only while on screen.
  useEffect(() => {
    if (reduced || pose !== 'sleeping') return;
    const id = window.setInterval(() => visible.current && setFrame((f) => f + 1), NAP_MS);
    return () => window.clearInterval(id);
  }, [pose, reduced]);

  // Looks up when a fine pointer comes within reach, if it isn't busy.
  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
    let near = false;
    const onMove = (e: PointerEvent) => {
      if (!visible.current || walking.current) return;
      const r = catRef.current?.getBoundingClientRect();
      if (!r) return;
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const next = d < 90;
      if (next !== near) {
        near = next;
        setPose((p) => (next && p === 'sleeping' ? 'alert' : !next && p === 'alert' ? 'sleeping' : p));
      }
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => removeEventListener('pointermove', onMove);
  }, [reduced]);

  const walkTo = (target: number) => {
    const from = x ?? 0;
    const dir: Pose = target > from ? 'E' : 'W';
    walking.current = true;
    setPose('alert');
    const start = performance.now() + 350;
    const duration = (Math.abs(target - from) / SPEED) * 1000;
    let raf = 0;
    const tick = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      setPose(dir);
      setFrame(Math.floor((now - start) / STEP_MS));
      setX(from + (target - from) * t);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        walking.current = false;
        setPose('tired');
        window.setTimeout(() => setPose((p) => (p === 'tired' ? 'sleeping' : p)), 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  };

  const wake = () => {
    if (walking.current) return;
    if (reduced) {
      setPose((p) => (p === 'sleeping' ? 'idle' : 'sleeping'));
      return;
    }
    const w = stripRef.current?.clientWidth ?? 0;
    const from = x ?? 0;
    // A hop of a third to two thirds of the rule, in whichever direction has room.
    const hop = w * (0.33 + Math.random() * 0.33);
    const target = from + hop <= w - SIZE ? from + hop : Math.max(0, from - hop);
    walkTo(target);
  };

  // Woken from elsewhere (the command palette). Deferred a frame so the
  // palette has closed and the cover is scrolling into view first.
  useEffect(() => {
    if (wakes === 0) return;
    const id = requestAnimationFrame(() => wake());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakes]);

  const onClick = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 3000), now];
    if (clicks.current.length >= EASTER_CLICKS && !checked) {
      // Easter egg: pester it enough and it signs the drawing.
      clicks.current = [];
      setChecked(true);
      setPose('scratchSelf');
      window.setTimeout(() => setPose('sleeping'), reduced ? 0 : 1200);
      return;
    }
    wake();
  };

  const frames = FRAMES[pose];
  const [fx, fy] = frames[(reduced ? 0 : frame) % frames.length];

  return (
    <div ref={stripRef} className="relative h-12" aria-hidden={x === null ? true : undefined}>
      {x !== null && (
        <button
          ref={catRef}
          type="button"
          onClick={onClick}
          aria-label={pose === 'sleeping' ? 'Wake the cat' : 'The cat'}
          title="The checker"
          className="absolute bottom-0 h-12 w-12 outline-offset-2"
          style={{ transform: `translateX(${x}px)` }}
        >
          <span
            aria-hidden="true"
            className="absolute bottom-[-4px] left-0 block"
            style={{
              width: TILE,
              height: TILE,
              transform: `scale(${SCALE})`,
              transformOrigin: 'bottom left',
              backgroundImage: 'url(/cat/tuxedo.webp)',
              backgroundPosition: `${fx * TILE}px ${fy * TILE}px`,
              imageRendering: 'pixelated',
            }}
          />
        </button>
      )}
      {checked && (
        <p role="status" className="absolute bottom-1 left-0 flex items-center gap-2 text-label text-redline">
          <svg viewBox="0 0 40 40" aria-hidden="true" className="h-5 w-5">
            <g fill="currentColor" transform="rotate(-12 20 20)">
              <ellipse cx="20" cy="26" rx="8.5" ry="7" />
              <ellipse cx="9.5" cy="16.5" rx="3.6" ry="4.6" />
              <ellipse cx="16" cy="10.5" rx="3.6" ry="4.8" />
              <ellipse cx="24" cy="10.5" rx="3.6" ry="4.8" />
              <ellipse cx="30.5" cy="16.5" rx="3.6" ry="4.6" />
            </g>
          </svg>
          Checked. The cat has signed off this sheet.
        </p>
      )}
    </div>
  );
}
