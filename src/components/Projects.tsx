import { useEffect, useRef, useState, type ComponentType, type PointerEvent } from 'react';
import { projects } from '../data/projects';
import { Reveal } from './Reveal';
import { CraftTraqVisual } from './projects/CraftTraqVisual';
import { RiskVisual } from './projects/RiskVisual';
import { NlpVisual } from './projects/NlpVisual';
import { EyeVisual } from './projects/EyeVisual';
import type { ProjectVisual } from '../data/types';

const VISUALS: Record<ProjectVisual, ComponentType> = {
  crafttraq: CraftTraqVisual,
  risk: RiskVisual,
  nlp: NlpVisual,
  eye: EyeVisual,
};

// Horizontal travel, in px, before a pointer drag counts as a swipe. Has to
// clear the slop of a tap on a touchscreen without demanding a full fling.
const SWIPE_THRESHOLD = 48;

const pad = (n: number) => String(n).padStart(2, '0');

export function Projects() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // Wraps rather than clamping: with four stations and a visible counter,
  // running off the end and landing back at 01 reads as a loop, not an error,
  // and it keeps both arrows live the way the design draws them.
  const go = (next: number) => setActive(((next % projects.length) + projects.length) % projects.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = sectionRef.current;
      if (!el) return;
      // Only steal the arrow keys while this section actually owns the
      // viewport — otherwise they'd hijack scrolling everywhere else.
      const rect = el.getBoundingClientRect();
      if (rect.bottom < window.innerHeight * 0.35 || rect.top > window.innerHeight * 0.65) return;
      e.preventDefault();
      go(active + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    // Vertical dominance means the user was scrolling the page, not swiping.
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1));
  };

  const project = projects[active];
  const Visual = VISUALS[project.visual];

  return (
    // The extra right padding from lg up is the gutter NavRail's vertical
    // column occupies — without it the 1280px panel slides underneath it.
    <section id="projects" ref={sectionRef} className="relative overflow-hidden bg-bg px-6 py-section lg:pr-40">
      {/* Blueprint grid, drifting one cell per cycle, plus the two corner
          glows that keep the flat panel from sitting on dead black. */}
      <div
        aria-hidden="true"
        className="proj-anim pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            'linear-gradient(rgba(91,143,240,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(91,143,240,.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px, 64px 64px',
          animation: 'proj-drift 38s linear infinite',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[180px] -top-40 h-[560px] w-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(43,92,168,.2), transparent 68%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[220px] -left-[200px] h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(28,88,116,.15), transparent 70%)' }}
      />

      <Reveal>
        <div className="relative mx-auto max-w-[1280px]">
          {/* ── Section header ──────────────────────────────────────── */}
          <div className="mb-[52px] flex flex-wrap items-end justify-between gap-8">
            <div>
              <div className="mb-[18px] flex items-center gap-3">
                <p className="font-mono text-[11.5px] tracking-[.24em] text-accent-text">§ 02 · PROJECTS</p>
                <span
                  aria-hidden="true"
                  className="block h-px w-[72px]"
                  style={{ background: 'linear-gradient(90deg,#2f6ad4,transparent)' }}
                />
              </div>
              <h2 className="text-balance font-display text-[clamp(2rem,4.4vw,3.6rem)] font-medium leading-[1.02] -tracking-[.025em] text-ink">
                Four builds, one flight line.
              </h2>
            </div>

            <div className="flex items-center gap-3.5">
              <span aria-live="polite" className="font-mono text-[11px] tracking-[.2em] text-ink-dim">
                {pad(active + 1)} / {pad(projects.length)}
              </span>
              {[
                { label: 'Previous project', glyph: '←', step: -1 },
                { label: 'Next project', glyph: '→', step: 1 },
              ].map((control) => (
                <button
                  key={control.label}
                  type="button"
                  aria-label={control.label}
                  onClick={() => go(active + control.step)}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-border bg-surface/80 text-[13px] text-ink-dim transition-colors duration-200 hover:border-accent-text hover:bg-accent-wash hover:text-ink"
                >
                  {control.glyph}
                </button>
              ))}
            </div>
          </div>

          {/* ── Station rail ────────────────────────────────────────── */}
          <div className="relative mb-2">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-[11px] h-px"
              style={{ background: 'repeating-linear-gradient(90deg,#26375a 0 7px, transparent 7px 14px)' }}
            />
            <div
              aria-hidden="true"
              className="proj-anim absolute top-[9px] h-[3px] w-[110px]"
              style={{
                background: 'linear-gradient(90deg,transparent,#5b8ff0,transparent)',
                filter: 'blur(1px)',
                opacity: 0,
                animation: 'proj-glide 6.5s cubic-bezier(.4,0,.6,1) infinite',
              }}
            />
            <div
              className="relative grid gap-3.5"
              style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}
            >
              {projects.map((entry, i) => {
                const isActive = i === active;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => go(i)}
                    className="group relative flex cursor-pointer flex-col items-start text-left"
                  >
                    {/* Station marker sitting on the rail. */}
                    <span aria-hidden="true" className="relative ml-3.5 flex h-[23px] w-[23px] items-center justify-center">
                      <span
                        className="absolute h-[9px] w-[9px] rounded-full transition-all duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)]"
                        style={{
                          background: isActive ? '#5b8ff0' : '#24374f',
                          boxShadow: isActive ? '0 0 0 4px rgba(91,143,240,.18)' : 'none',
                        }}
                      />
                      {isActive && (
                        <span
                          className="proj-anim absolute h-[11px] w-[11px] rounded-full border border-accent-text"
                          style={{ animation: 'proj-ring 2.4s ease-out infinite' }}
                        />
                      )}
                    </span>

                    <span
                      className={`relative mt-2.5 flex w-full flex-col gap-[7px] overflow-hidden rounded-2xl border px-[18px] pb-[19px] pt-[17px] transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-1 group-hover:border-accent-text/50 ${
                        isActive ? '-translate-y-1 border-accent-text/55' : 'border-[rgba(90,130,200,.16)]'
                      }`}
                      style={{
                        background: isActive
                          ? 'linear-gradient(160deg, rgba(20,38,70,.95), rgba(9,15,27,.95))'
                          : 'linear-gradient(160deg, rgba(13,22,38,.75), rgba(8,13,23,.75))',
                        boxShadow: '0 18px 40px -26px rgba(0,0,0,.9)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-[14%] top-0 h-px origin-center transition-transform duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
                          isActive ? 'scale-x-100' : 'scale-x-0'
                        }`}
                        style={{ background: 'linear-gradient(90deg,transparent,#7fb0ff,transparent)' }}
                      />
                      <span
                        className={`font-mono text-[10px] tracking-[.2em] transition-colors duration-300 ${
                          isActive ? 'text-accent-text' : 'text-[#4a5f80]'
                        }`}
                      >
                        {pad(i + 1)} · {entry.live ? 'LIVE' : 'BUILD'}
                      </span>
                      <span
                        className={`text-base font-medium -tracking-[.01em] transition-colors duration-300 ${
                          isActive ? 'text-white' : 'text-ink-dim'
                        }`}
                      >
                        {entry.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Active project panel ────────────────────────────────── */}
          <div
            className="relative mt-[34px] overflow-hidden rounded-[26px]"
            style={{
              border: '1px solid rgba(120,160,220,.14)',
              background: 'linear-gradient(165deg, rgba(16,26,44,.88), rgba(7,12,22,.94))',
              boxShadow: '0 50px 110px -50px rgba(0,0,0,.9), inset 0 1px 0 rgba(180,210,255,.07)',
            }}
          >
            <div
              aria-hidden="true"
              className="proj-anim absolute inset-x-[12%] top-0 h-px"
              style={{
                background: 'linear-gradient(90deg,transparent,rgba(140,190,255,.5),transparent)',
                animation: 'proj-sheen 5s ease-in-out infinite',
              }}
            />

            {/* Keyed on the active index so every CSS entrance animation inside
                replays on each change — the panel is remounted, not diffed. */}
            <div
              key={project.id}
              className="flex flex-wrap items-stretch"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              <div
                className="flex min-w-0 flex-col px-[30px] py-[34px]"
                style={{ flex: '1 1 260px', borderBottom: '1px solid rgba(90,130,200,.14)' }}
              >
                <div className="proj-anim mb-[22px] flex items-center gap-2.5" style={{ animation: 'proj-fade .5s both' }}>
                  <span className="font-mono text-[10px] tracking-[.2em] text-accent-text">{project.tag}</span>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1"
                    style={{ background: 'linear-gradient(90deg,rgba(91,143,240,.5),transparent)' }}
                  />
                  {project.live && (
                    <span
                      className="flex items-center gap-[7px] px-[9px] py-1"
                      style={{ border: '1px solid rgba(74,222,128,.4)', background: 'rgba(74,222,128,.09)' }}
                    >
                      <span
                        aria-hidden="true"
                        className="proj-anim h-[5px] w-[5px] rounded-full"
                        style={{ background: '#4ade80', animation: 'proj-pulse 1.8s ease-in-out infinite' }}
                      />
                      <span className="font-mono text-[9px] tracking-[.2em]" style={{ color: '#a7e8bf' }}>
                        LIVE
                      </span>
                    </span>
                  )}
                </div>

                <h3
                  className="proj-anim mb-3 font-display text-[clamp(1.6rem,2.8vw,2.4rem)] font-semibold leading-[1.02] -tracking-[.025em] text-white"
                  style={{ animation: 'proj-rise .7s cubic-bezier(.2,.8,.2,1) both .05s' }}
                >
                  {project.name}
                </h3>
                <p
                  className="proj-anim mb-[26px] max-w-[52ch] text-[15px] leading-[1.5] text-ink-dim"
                  style={{ animation: 'proj-rise .7s cubic-bezier(.2,.8,.2,1) both .12s' }}
                >
                  {project.tagline}
                </p>

                <div className="mb-7 flex flex-wrap gap-1.5">
                  {project.stack.map((tech, i) => (
                    <span
                      key={tech}
                      className="proj-anim rounded-full border border-[rgba(90,130,200,.22)] px-[11px] py-1.5 font-mono text-[10px] tracking-[.08em] text-[#9db8de] transition-all duration-300 hover:border-accent-text hover:bg-accent-wash hover:text-ink"
                      style={{
                        background: 'rgba(91,143,240,.06)',
                        animation: 'proj-rise .6s cubic-bezier(.2,.8,.2,1) both',
                        animationDelay: `${(0.18 + i * 0.055).toFixed(2)}s`,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {project.links.length > 0 && (
                  <div
                    className="proj-anim mt-auto flex flex-col gap-0.5"
                    style={{ animation: 'proj-fade .8s both .3s' }}
                  >
                    {project.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2.5 border-t border-[rgba(90,130,200,.14)] py-[11px] font-mono text-[10.5px] tracking-[.18em] text-ink-dim transition-all duration-300 hover:pl-1.5 hover:text-ink"
                      >
                        <span>{link.label}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="relative flex min-w-0 items-center justify-center overflow-hidden px-[26px] py-[30px]"
                style={{
                  flex: '1 1 440px',
                  background: 'radial-gradient(120% 90% at 60% 10%, rgba(28,52,92,.32), transparent 70%)',
                }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(91,143,240,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(91,143,240,.07) 1px, transparent 1px)',
                    backgroundSize: '32px 32px, 32px 32px',
                  }}
                />
                <div className="absolute left-[22px] top-5 font-mono text-[9px] tracking-[.2em]" style={{ color: '#3a5580' }}>
                  {project.station}
                </div>
                <Visual />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
