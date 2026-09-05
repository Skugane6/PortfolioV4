import { useEffect, useRef, useState } from 'react';
import { experience, education } from '../data/experience';
import { PlaneCutawaySvg } from './experience/PlaneCutawaySvg';
import { useCutawayMode } from './experience/useCutawayMode';
import { computeCutawayValues, phaseLabel, progressFromRect } from './experience/cutawayMath';

const role = experience[0];

export function Experience() {
  const mode = useCutawayMode();
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [open, setOpen] = useState(mode === 'static');
  const [readout, setReadout] = useState(0);
  const [phase, setPhase] = useState(() => phaseLabel(mode === 'static' ? 1 : 0));

  const applyP = (rawP: number) => {
    const el = trackRef.current;
    if (!el) return;
    const { p, pi, po, pr } = computeCutawayValues(rawP, mode);
    el.style.setProperty('--pi', pi.toFixed(4));
    el.style.setProperty('--po', po.toFixed(4));
    el.style.setProperty('--pr', pr.toFixed(4));
    const nextReadout = Math.round(p * 100);
    setReadout((prev) => (prev === nextReadout ? prev : nextReadout));
    const nextPhase = phaseLabel(p);
    setPhase((prev) => (prev === nextPhase ? prev : nextPhase));
  };

  useEffect(() => {
    if (mode !== 'scroll') {
      applyP(mode === 'static' ? 1 : 0);
      return;
    }
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = trackRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          applyP(progressFromRect(rect.top, rect.height, window.innerHeight));
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onTap = () => {
    if (mode === 'static') return;
    const from = open ? 1 : 0;
    const to = open ? 0 : 1;
    setOpen(!open);
    const start = performance.now();
    const duration = 900;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      applyP(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const trackHeight = mode === 'scroll' ? '360vh' : '110vh';
  const hint =
    mode === 'static'
      ? 'CUTAWAY SHOWN OPEN — REDUCED MOTION'
      : mode === 'tap'
        ? open
          ? 'TAP TO CLOSE'
          : 'TAP TO OPEN'
        : 'SCROLL TO OPEN';

  return (
    <section id="experience" className="relative bg-[#07090d]" style={{ height: trackHeight }}>
      <div ref={trackRef} className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(96,128,180,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,128,180,0.05)_1px,transparent_1px)] bg-[length:48px_48px]"
        />

        <div className="absolute left-8 right-8 top-8 flex items-start justify-between gap-5 font-mono text-[10px] tracking-widest text-ink-dim">
          <div>
            <div className="text-accent-text">§ 01 · EXPERIENCE</div>
            <div className="mt-2">CRJ-900 · SIDE ELEVATION · CUTAWAY SEQUENCE</div>
            <div className="mt-2 animate-pulse text-amber-signal">{hint}</div>
          </div>
          <div className="text-right">
            <div>{phase}</div>
            <div className="mt-2 flex items-center justify-end gap-2.5">
              <div className="h-0.5 w-[120px] overflow-hidden bg-border">
                <div
                  className="h-full origin-left bg-amber-signal"
                  style={{ transform: `scaleX(${readout / 100})` }}
                />
              </div>
              <span className="inline-block w-9 text-right">{String(readout).padStart(2, '0')}%</span>
            </div>
          </div>
        </div>

        <div className="relative w-[min(1560px,96vw)]">
          <div
            className="relative w-full"
            style={{
              aspectRatio: '1600 / 420',
              containerType: 'size',
              transform: 'scale(calc(0.955 + var(--pi, 0) * 0.045))',
              opacity: 'calc(0.15 + var(--pi, 0) * 0.85)',
            }}
          >
            <PlaneCutawaySvg />

            <div
              className="absolute overflow-hidden"
              style={{
                left: '20.8%',
                right: '29.2%',
                top: '50%',
                transform: 'translateY(-50%)',
                height: 'calc(var(--po, 0) * 101%)',
                background: 'linear-gradient(180deg, rgba(9,13,20,0.94), rgba(11,17,27,0.97))',
                borderTop: '1px solid rgba(120,140,170,0.22)',
                borderBottom: '1px solid rgba(120,140,170,0.22)',
              }}
            >
              <div style={{ padding: '5cqh 3cqw', opacity: 'calc(var(--pr, 0) * 1.4)' }}>
                <div className="flex items-baseline justify-between gap-4 border-b border-[rgba(120,140,170,0.16)] pb-[2.5cqh] font-mono text-[clamp(9px,4cqh,14px)] tracking-widest text-ink-dim">
                  <span>STA 210 · CABIN BAY 02 · EXPERIENCE</span>
                  <span className="text-amber-signal">● OPEN</span>
                </div>
                <div className="mt-[2cqh] flex flex-wrap items-baseline gap-x-[2cqw] gap-y-[1.5cqh]">
                  <div className="font-mono text-[clamp(9px,4.2cqh,14px)] tracking-widest text-ink-dim">
                    {role.start} – {role.end}
                  </div>
                  <div className="font-display text-[clamp(14px,8cqh,26px)] font-semibold text-ink">
                    {role.role} · {role.company}
                  </div>
                  <div className="font-mono text-[clamp(8px,3.6cqh,13px)] tracking-widest text-ink-dim">
                    {role.location.toUpperCase()}
                  </div>
                </div>
                <div className="mt-[3cqh] grid grid-cols-2 gap-x-[3cqw] gap-y-[1.6cqh] text-[clamp(10px,4.2cqh,15px)] leading-snug text-ink">
                  {role.highlights.map((line, i) => (
                    <div
                      key={line}
                      className="flex gap-2.5"
                      style={{
                        opacity: `calc((var(--pr, 0) - ${(i * 0.08).toFixed(2)}) * 3.4)`,
                        transform: 'translateY(calc((1 - var(--pr, 0)) * 12px))',
                      }}
                    >
                      <span className="pt-0.5 font-mono text-[clamp(8px,3.4cqh,12px)] text-accent-text">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {mode === 'tap' && (
            <button
              type="button"
              onClick={onTap}
              className="mx-auto mt-6 block rounded border border-amber-signal px-5 py-3 font-mono text-[11px] tracking-widest text-amber-signal"
            >
              {open ? 'TAP TO CLOSE CUTAWAY' : 'TAP TO OPEN CUTAWAY'}
            </button>
          )}
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex justify-between font-mono text-[9px] tracking-widest text-ink-dim">
          <span>
            {education.program}, {education.school} · {education.graduation}
          </span>
          <span>SHEET 01 / REV —</span>
        </div>
      </div>
    </section>
  );
}
