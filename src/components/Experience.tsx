import { useEffect, useRef, useState } from 'react';
import { experience, education } from '../data/experience';
import { PlaneCutawaySvg } from './experience/PlaneCutawaySvg';
import { useCutawayMode } from './experience/useCutawayMode';
import { computeCutawayValues, phaseLabel, progressFromRect } from './experience/cutawayMath';

const role = experience[0];

const SPECS = [
  { label: 'LENGTH', value: '36.40 m' },
  { label: 'WINGSPAN', value: '24.85 m' },
  { label: 'HEIGHT', value: '7.49 m' },
  { label: 'ENGINES', value: 'GE CF34-8C5' },
  { label: 'THRUST', value: '14,510 lbf ×2' },
  { label: 'RANGE', value: '2,956 km' },
];

export function Experience() {
  const mode = useCutawayMode();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [open, setOpen] = useState(mode === 'static');
  const [readout, setReadout] = useState(0);
  const [phase, setPhase] = useState(() => phaseLabel(mode === 'static' ? 1 : 0));

  const applyP = (rawP: number) => {
    const el = trackRef.current;
    if (!el) return;
    const { p, pi, pp, pr } = computeCutawayValues(rawP, mode);
    el.style.setProperty('--pi', pi.toFixed(4));
    el.style.setProperty('--pp', pp.toFixed(4));
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
        const el = sectionRef.current;
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
      ? 'ROLE DETAILS SHOWN — REDUCED MOTION'
      : mode === 'tap'
        ? open
          ? 'TAP TO HIDE ROLE DETAILS'
          : 'TAP TO SHOW ROLE DETAILS'
        : 'SCROLL FOR ROLE DETAILS ↓';

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative bg-[#07090d]"
      style={{ height: trackHeight }}
    >
      <div ref={trackRef} className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(96,128,180,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,128,180,0.05)_1px,transparent_1px)] bg-[length:48px_48px]"
        />

        <div className="absolute left-8 right-8 top-8 flex items-start justify-between gap-5 font-mono text-[10px] tracking-widest text-ink-dim">
          <div>
            <div className="text-accent-text">§ 01 · EXPERIENCE</div>
            <div className="mt-2 font-display text-lg tracking-normal text-ink">CRJ-900</div>
            <div className="mt-1">MHIRJ · MITSUBISHI HEAVY INDUSTRIES</div>
            <div className="mt-2 motion-safe:animate-pulse text-amber-signal">{hint}</div>
          </div>
          <div className="hidden text-right sm:block">
            <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
              {SPECS.map((spec) => (
                <div key={spec.label} className="whitespace-nowrap">
                  <span>{spec.label} </span>
                  <span className="text-ink">{spec.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">{phase}</div>
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

        <div className="relative flex w-[min(1560px,96vw)] flex-col items-center" style={{ height: '74vh', containerType: 'size' }}>
          <div
            className="relative w-full"
            style={{
              height: '54cqh',
              aspectRatio: '1600 / 500',
              transform: 'scale(calc(0.965 + var(--pi, 0) * 0.035))',
              opacity: 'calc(0.15 + var(--pi, 0) * 0.85)',
            }}
          >
            <PlaneCutawaySvg />
          </div>

          <div
            className="w-full overflow-hidden"
            style={{ height: 'calc(var(--pp, 0) * 38cqh)' }}
          >
            <div
              className="h-full overflow-y-auto rounded-b-lg border-x border-b border-[rgba(120,140,170,0.22)]"
              style={{
                background: 'linear-gradient(180deg, rgba(9,13,20,0.94), rgba(11,17,27,0.97))',
                transform: 'translateY(calc((1 - var(--pp, 0)) * 28px))',
                opacity: 'var(--pp, 0)',
              }}
            >
              <div style={{ padding: '4cqh 3cqw' }}>
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
              {open ? 'TAP TO HIDE ROLE DETAILS' : 'TAP TO SHOW ROLE DETAILS'}
            </button>
          )}
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex justify-between font-mono text-[9px] tracking-widest text-ink-dim">
          <span>
            {education.program}, {education.school} · {education.graduation}
          </span>
          <span>SHEET 01 / REV B</span>
        </div>
      </div>
    </section>
  );
}
