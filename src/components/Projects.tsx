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

// The one hairline value used for every internal division in this section — the
// panel's column split, the rail segments, the chip borders — so they all read
// as the same drawn line rather than four near-misses.
const HAIRLINE = 'rgba(90,130,200,.16)';

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
    // The lg gutter is mirrored on both sides rather than applied only on the
    // right: the right one has to clear NavRail's vertical column, and matching
    // it on the left is what leaves the block centred on the page instead of
    // sitting a rail's width off to one side.
    <section
      id="projects"
      ref={sectionRef}
      className="relative overflow-hidden bg-bg px-5 py-24 sm:px-6 sm:py-28 lg:px-40 lg:py-section"
    >
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
          {/* ── Section header ──────────────────────────────────────────
              The label is the section's heading now that the display h2 is
              gone, so it carries the h2 and a size to match. Centred between
              two mirrored rules; the rules shrink rather than hold a fixed
              width, which is what keeps the row inside 320px. */}
          <div className="relative">
            {/* Oversized outline word sitting behind the label. Decorative
                only — aria-hidden, and the section's overflow-hidden is what
                clips it where it outgrows a narrow viewport. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 'clamp(-34px, -3vw, -10px)',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(74px, 13vw, 190px)',
                lineHeight: 0.9,
                letterSpacing: '.02em',
                color: 'transparent',
                WebkitTextStroke: '1px rgba(140, 176, 255, .17)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              PROJECTS
            </div>

            {/* relative so the label row stacks above the outline */}
            <div className="relative flex items-center justify-center gap-4 sm:gap-5">
              <span
                aria-hidden="true"
                className="block h-px w-full max-w-[110px] shrink"
                style={{ background: 'linear-gradient(90deg,transparent,#2f6ad4)' }}
              />
              <h2 className="whitespace-nowrap font-mono text-[15px] tracking-[.26em] text-accent-text sm:text-[18px] sm:tracking-[.3em]">
                § 02 · PROJECTS
              </h2>
              <span
                aria-hidden="true"
                className="block h-px w-full max-w-[110px] shrink"
                style={{ background: 'linear-gradient(90deg,#2f6ad4,transparent)' }}
              />
            </div>
          </div>

          {/* The panel is not a live region, so without this nothing tells a
              screen reader that an arrow key or a swipe changed anything.
              Announced, not shown — the visible counter is gone by design. */}
          <p aria-live="polite" className="sr-only">
            Project {active + 1} of {projects.length}: {project.name}
          </p>

          {/* ── Flight line ─────────────────────────────────────────────
              One dashed rule with a light running down it, lifted out of the
              station grid: as a sibling it stays a single continuous line no
              matter how many rows the stations wrap into. */}
          <div aria-hidden="true" className="relative mb-5 mt-8 h-[3px] sm:mb-6 sm:mt-9">
            <div
              className="absolute inset-x-0 top-[1px] h-px"
              style={{ background: 'repeating-linear-gradient(90deg,#26375a 0 7px, transparent 7px 14px)' }}
            />
            <div
              className="proj-anim absolute top-0 h-[3px] w-[110px]"
              style={{
                background: 'linear-gradient(90deg,transparent,#5b8ff0,transparent)',
                filter: 'blur(1px)',
                opacity: 0,
                animation: 'proj-glide 6.5s cubic-bezier(.4,0,.6,1) infinite',
              }}
            />
          </div>

          {/* ── Station selector ────────────────────────────────────────
              Fixed column counts rather than auto-fit minmax: auto-fit left a
              stranded fourth card at tablet widths and four full-width slabs
              on phones. Each card now carries its own rail head, so the
              markers stay aligned however the grid wraps. */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            {projects.map((entry, i) => {
              const isActive = i === active;

              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => go(i)}
                  className={`group relative flex cursor-pointer flex-col items-start gap-2 overflow-hidden rounded-xl border px-3 py-3 text-left transition-[transform,border-color] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5 hover:border-accent-text/45 sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-[15px] ${
                    isActive ? 'border-accent-text/55' : 'border-[rgba(90,130,200,.16)]'
                  }`}
                  style={{
                    background: isActive
                      ? 'linear-gradient(160deg, rgba(20,38,70,.95), rgba(9,15,27,.95))'
                      : 'linear-gradient(160deg, rgba(13,22,38,.75), rgba(8,13,23,.75))',
                    boxShadow: isActive
                      ? '0 18px 40px -26px rgba(0,0,0,.9), inset 0 1px 0 rgba(150,190,255,.09)'
                      : '0 18px 40px -26px rgba(0,0,0,.9)',
                  }}
                >
                  {/* Rail head: station marker plus its own length of dashed
                      line, inside the card rather than floating above it. */}
                  <span className="flex w-full items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="relative flex h-[11px] w-[11px] shrink-0 items-center justify-center"
                    >
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
                      className={`whitespace-nowrap font-mono text-[9.5px] tracking-[.18em] transition-colors duration-300 sm:text-[10px] sm:tracking-[.2em] ${
                        isActive ? 'text-accent-text' : 'text-[#4a5f80]'
                      }`}
                    >
                      {pad(i + 1)} · {entry.live ? 'LIVE' : 'BUILD'}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px min-w-0 flex-1"
                      style={{
                        background: isActive
                          ? 'repeating-linear-gradient(90deg,rgba(91,143,240,.55) 0 5px, transparent 5px 10px)'
                          : 'repeating-linear-gradient(90deg,#22314c 0 5px, transparent 5px 10px)',
                      }}
                    />
                  </span>

                  <span
                    className={`text-[13.5px] font-medium leading-[1.3] -tracking-[.01em] transition-colors duration-300 sm:text-[15px] ${
                      isActive ? 'text-white' : 'text-ink-dim group-hover:text-ink'
                    }`}
                  >
                    {entry.name}
                  </span>

                  {/* Selection reads as an underline filling in rather than the
                      card lifting: a raised active card left the row ragged
                      against its neighbours. */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-[2px] origin-left transition-transform duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                    style={{ background: 'linear-gradient(90deg,#5b8ff0,rgba(91,143,240,0))' }}
                  />
                </button>
              );
            })}
          </div>

          {/* ── Active project panel ────────────────────────────────── */}
          <div
            className="relative mt-4 overflow-hidden rounded-[20px] sm:mt-6 sm:rounded-[26px]"
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

            {/* Keyed on the active project so every CSS entrance animation
                inside replays on each change — the panel is remounted, not
                diffed. Two declared columns from lg up rather than flex-basis
                wrapping, which used to collapse at unpredictable widths. The
                min-height holds the panel steady as taller and shorter
                visuals swap through. */}
            <div
              key={project.id}
              className="grid xl:min-h-[460px] xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              {/* Visual leads on narrow screens — the product shot is the hook,
                  and stacking the whole text column above it buried it. */}
              <div
                className="relative order-1 flex flex-col border-b xl:order-2 xl:border-b-0 xl:border-l"
                style={{
                  borderColor: HAIRLINE,
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

                {/* Title block, drawing convention: station reference on the
                    left, sheet number on the right, hairline under both. In
                    flow rather than absolutely placed, so it can never land on
                    top of the visual at a narrow width. */}
                <div
                  className="relative flex items-center justify-between gap-4 border-b px-5 py-3.5 sm:px-7 xl:px-9"
                  style={{ borderColor: 'rgba(90,130,200,.1)' }}
                >
                  <span
                    className="truncate font-mono text-[9px] tracking-[.2em] sm:text-[9.5px]"
                    style={{ color: '#4a6790' }}
                  >
                    {project.station}
                  </span>
                  <span
                    className="shrink-0 font-mono text-[9px] tracking-[.2em] sm:text-[9.5px]"
                    style={{ color: '#3a5580' }}
                  >
                    FIG. {pad(active + 1)}
                  </span>
                </div>

                <div className="relative flex flex-1 items-center justify-center px-5 py-8 sm:px-7 sm:py-10 xl:px-9 xl:py-12">
                  <Visual />
                </div>
              </div>

              {/* Centred against the visual from lg up rather than top-aligned
                  with the links pinned to the floor: the shorter entries left a
                  200px hole between their stack row and their one button. */}
              <div className="order-2 flex min-w-0 flex-col px-5 py-7 sm:px-7 sm:py-9 xl:order-1 xl:justify-center xl:px-9 xl:py-11">
                <div className="proj-anim mb-5 flex items-center gap-2.5" style={{ animation: 'proj-fade .5s both' }}>
                  <span className="whitespace-nowrap font-mono text-[10px] tracking-[.2em] text-accent-text">
                    {project.tag}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-px min-w-0 flex-1"
                    style={{ background: 'linear-gradient(90deg,rgba(91,143,240,.5),transparent)' }}
                  />
                  {project.live && (
                    <span
                      className="flex shrink-0 items-center gap-[7px] rounded-full px-2.5 py-1"
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
                  className="proj-anim mb-3.5 text-balance font-display text-[clamp(1.75rem,4.6vw,2.5rem)] font-semibold leading-[1.02] -tracking-[.025em] text-white"
                  style={{ animation: 'proj-rise .7s cubic-bezier(.2,.8,.2,1) both .05s' }}
                >
                  {project.name}
                </h3>
                <p
                  className="proj-anim mb-8 max-w-[50ch] text-[14.5px] leading-[1.62] text-ink-dim sm:text-[15px]"
                  style={{ animation: 'proj-rise .7s cubic-bezier(.2,.8,.2,1) both .12s' }}
                >
                  {project.tagline}
                </p>

                {/* Labelled block rather than a loose chip cloud — the caption
                    gives the row a reason to be there and lines it up with the
                    drawing labels on the other side of the split. */}
                <div>
                  <div
                    className="proj-anim mb-3 flex items-center gap-2.5"
                    style={{ animation: 'proj-fade .6s both .16s' }}
                  >
                    <span className="font-mono text-[9px] tracking-[.22em]" style={{ color: '#4a5f80' }}>
                      STACK
                    </span>
                    <span aria-hidden="true" className="h-px min-w-0 flex-1" style={{ background: HAIRLINE }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.stack.map((tech, i) => (
                      <span
                        key={tech}
                        className="proj-anim rounded-full border border-[rgba(90,130,200,.22)] px-[11px] py-1.5 font-mono text-[10px] tracking-[.08em] text-[#9db8de] transition-colors duration-300 hover:border-accent-text hover:bg-accent-wash hover:text-ink"
                        style={{
                          background: 'rgba(91,143,240,.06)',
                          animation: 'proj-rise .6s cubic-bezier(.2,.8,.2,1) both',
                          animationDelay: `${(0.2 + i * 0.055).toFixed(2)}s`,
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {project.links.length > 0 && (
                  <div
                    className="proj-anim mt-8 flex flex-wrap gap-2.5"
                    style={{ animation: 'proj-fade .8s both .3s' }}
                  >
                    {project.links.map((link, i) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`group/link inline-flex min-h-[44px] items-center gap-3 rounded-full border px-5 font-mono text-[10.5px] tracking-[.18em] transition-colors duration-300 ${
                          i === 0
                            ? 'border-accent-text/45 bg-accent-wash text-ink hover:border-accent-text hover:bg-accent/25'
                            : 'border-[rgba(90,130,200,.22)] text-ink-dim hover:border-accent-text/50 hover:text-ink'
                        }`}
                      >
                        <span>{link.label}</span>
                        <span
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                        >
                          ↗
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
