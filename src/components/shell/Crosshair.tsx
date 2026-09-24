import { useEffect, useRef, useState } from 'react';
import { useReducedMotionPref } from '../../lib/motion';
import { useUi } from '../../lib/ui';

const TARGETS = 'a[href], button, input, textarea, select, summary, [role="option"], [role="slider"]';
const MM = 25.4 / 96; // CSS mm per CSS px
const COLS = 8;
const ROWS = 'ABCDEF';

/**
 * A drafting crosshair that rides with the (still visible) native cursor and
 * reads out where it is on the drawing: the sheet, its zone (the letters and
 * numbers along each sheet's edge) and the position from the sheet's top-left
 * corner in millimetres. Over something clickable it becomes registration
 * brackets around the target. Fine pointers only, from 1024px (where zones
 * are drawn), never under reduced motion, and off from the command palette.
 */
export function Crosshair() {
  const enabled = useUi((s) => s.crosshair);
  const reduced = useReducedMotionPref();
  const [capable, setCapable] = useState(false);
  const crossRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (min-width: 1024px)');
    const sync = () => setCapable(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const on = capable && enabled && !reduced;

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    let last: PointerEvent | null = null;
    const draw = () => {
      frame = 0;
      const e = last;
      const cross = crossRef.current;
      const readout = readoutRef.current;
      const bracket = bracketRef.current;
      if (!e || !cross || !readout || !bracket) return;
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const { clientX: x, clientY: y } = e;
      cross.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cross.style.opacity = '1';

      const el = document.elementFromPoint(x, y);
      const sheet = el?.closest<HTMLElement>('section[data-sheet]');
      const target = el?.closest<HTMLElement>(TARGETS);
      if (sheet) {
        const r = sheet.getBoundingClientRect();
        const col = Math.min(COLS, Math.max(1, Math.ceil(((x - r.left) / r.width) * COLS)));
        const row = ROWS[Math.min(ROWS.length - 1, Math.max(0, Math.floor(((y - r.top) / r.height) * ROWS.length)))];
        const mx = Math.round((x - r.left) * MM);
        const my = Math.round((y - r.top) * MM);
        readout.textContent = `${sheet.dataset.sheet?.padStart(2, '0')} ${row}${col}  ${mx} × ${my} mm`;
        readout.style.opacity = '1';
      } else {
        readout.style.opacity = '0';
      }

      if (target && !target.closest('dialog:not([open])')) {
        const t = target.getBoundingClientRect();
        bracket.style.transform = `translate3d(${t.left - 5}px, ${t.top - 5}px, 0)`;
        bracket.style.width = `${t.width + 10}px`;
        bracket.style.height = `${t.height + 10}px`;
        bracket.style.opacity = '1';
        cross.style.opacity = '0';
      } else {
        bracket.style.opacity = '0';
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onLeave = () => {
      [crossRef, readoutRef, bracketRef].forEach((r) => r.current && (r.current.style.opacity = '0'));
    };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('scroll', () => last && onMove(last), { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      onLeave();
    };
  }, [on]);

  if (!on) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]">
      <div ref={crossRef} className="absolute left-0 top-0 opacity-0" style={{ willChange: 'transform' }}>
        <span className="absolute -left-[14px] top-0 h-px w-[28px] bg-redline/80" />
        <span className="absolute -top-[14px] left-0 h-[28px] w-px bg-redline/80" />
        <div
          ref={readoutRef}
          className="ground absolute left-4 top-4 whitespace-pre border border-faded/60 px-1.5 py-0.5 font-mono text-label text-blueprint opacity-0"
        />
      </div>
      <div
        ref={bracketRef}
        className="absolute left-0 top-0 opacity-0 transition-[opacity] duration-quick"
        style={{ willChange: 'transform, width, height' }}
      >
        {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'bottom-0 left-0 border-b border-l', 'bottom-0 right-0 border-b border-r'].map(
          (pos) => (
            <span key={pos} className={`absolute h-2.5 w-2.5 border-checker ${pos}`} />
          ),
        )}
      </div>
    </div>
  );
}
