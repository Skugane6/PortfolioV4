import portrait from '../assets/hero.jpg';
import { useStageTilt } from '../hooks/useStageTilt';
import { HeroStage } from './hero/HeroStage';

// The hero runs its own palette rather than the site tokens in index.css.
// It is a full-bleed section that vignettes to near-black at every edge, so
// it seats cleanly above --color-bg without the two having to match, and
// diluting these values into the shared tokens would drag the rest of the
// site's blues along with them.
const INK = '#e6eefc';
const ACCENT = '#5b95ef';
const DIM = '#93a9ca';
const FAINT = '#4d74b6';
const FAINTEST = '#3f6098';

// Headline is split into four lines so each can rise in on its own beat.
// The line breaks are the design's, not a consequence of wrapping — they
// are what puts "scalable" and "systems" on separate accented lines.
// Each line carries a trailing space: the spans are block-level, so it
// collapses visually, but without it the h1's textContent (and its
// accessible name) would run the lines together as "scalablesystems".
const HEADLINE_LINES = [
  {
    key: 'build',
    delay: '.05s',
    content: (
      <>
        I build <span style={{ color: ACCENT }}>scalable</span>
      </>
    ),
  },
  {
    key: 'systems',
    delay: '.16s',
    content: (
      <>
        <span style={{ color: ACCENT }}>systems</span> that
      </>
    ),
  },
  { key: 'create', delay: '.27s', content: 'create real' },
  { key: 'impact', delay: '.38s', content: 'impact.' },
];

export function Hero() {
  const { sectionRef, boxRef, stageRef } = useStageTilt();

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col overflow-hidden font-sans"
      style={{ background: '#050b16', color: INK }}
    >
      {/* Drifting minor grid, dimmed toward the edges by its own radial. */}
      <div
        aria-hidden="true"
        className="hero-anim pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74,132,224,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(74,132,224,.055) 1px, transparent 1px), radial-gradient(120% 90% at 50% 40%, rgba(10,26,54,0) 0%, rgba(5,11,22,.85) 78%)',
          backgroundSize: '40px 40px, 40px 40px, 100% 100%',
          animation: 'hero-grid-drift 60s linear infinite',
        }}
      />
      {/* Static major grid on top, so the drift reads as depth rather than slide. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,150,240,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(90,150,240,.09) 1px, transparent 1px)',
          backgroundSize: '200px 200px, 200px 200px',
        }}
      />
      <div
        aria-hidden="true"
        className="hero-anim pointer-events-none absolute"
        style={{
          right: '-6%',
          top: '8%',
          width: '62vw',
          height: '72vh',
          background: 'radial-gradient(closest-side, rgba(35,95,215,.30), rgba(35,95,215,0))',
          filter: 'blur(10px)',
          animation: 'hero-glow-breathe 9s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 100% at 30% 30%, rgba(5,11,22,0) 35%, rgba(3,7,14,.9) 100%)',
        }}
      />

      {/* Decorative lockup only — NavRail (fixed, rendered from App) remains
          the one real section nav, so the imported design's own right-edge
          nav is deliberately not reproduced here. */}
      <header className="relative z-[6] flex items-start justify-between px-6 pt-[26px] md:px-[34px]">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-[42px] w-[42px] items-center justify-center font-mono text-sm tracking-[0.06em]"
            style={{
              border: '1px solid rgba(96,150,245,.55)',
              color: '#7fabf5',
              boxShadow: 'inset 0 0 18px rgba(40,100,220,.25)',
            }}
          >
            SK
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-mono text-xs tracking-[0.2em]" style={{ color: '#dbe7fb' }}>
              SEARAN KUGANESAN
            </div>
            <div className="font-mono text-[9px] tracking-[0.28em]" style={{ color: '#5b86cc' }}>
              SOFTWARE ENGINEER
            </div>
          </div>
        </div>
        <div
          className="hidden flex-col items-end gap-[5px] font-mono text-[9px] tracking-[0.3em] sm:flex"
          style={{ color: FAINT }}
        >
          <div>BUILD</div>
          <div>SOLVE</div>
          <div>IMPROVE</div>
        </div>
      </header>

      {/* Columns stretch rather than centre so the stage's box inherits the
          copy column's height — that height is what --fit is measured
          against, and centring would leave it at its bare minimum. */}
      <div className="relative z-[5] grid flex-1 gap-5 px-6 pb-10 pt-6 md:px-[34px] lg:grid-cols-2 lg:pb-[90px] lg:pl-[108px] lg:pr-[160px]">
        <div className="relative max-w-[620px] self-center pl-[22px]">
          <div
            aria-hidden="true"
            className="absolute left-0 top-1.5 w-px"
            style={{
              bottom: 78,
              background: 'linear-gradient(180deg, rgba(96,150,245,.7), rgba(96,150,245,0))',
            }}
          />

          <div
            className="hero-anim mb-[26px] flex items-center gap-4"
            style={{ animation: 'hero-fade-in .8s ease both' }}
          >
            {/* The only photograph on the page, and the only element in the
                hero that is not either type or drawn chrome — hence the ring
                and glow, which borrow the SK lockup's treatment so it reads
                as part of the same technical vocabulary. */}
            <img
              src={portrait}
              alt="Searan Kuganesan"
              width={60}
              height={60}
              className="h-[60px] w-[60px] flex-none rounded-full object-cover"
              style={{
                border: '1px solid rgba(96,150,245,.55)',
                boxShadow: '0 0 18px rgba(40,100,220,.35)',
              }}
            />
            <span
              className="whitespace-nowrap font-mono text-[11px] tracking-[0.34em]"
              style={{ color: '#5f92ef' }}
            >
              // SOFTWARE ENGINEER
            </span>
            {/* Trailing flourish; the portrait plus the label already fill the
                row at 390px, so it only appears once there is space for it. */}
            <span
              aria-hidden="true"
              className="hidden h-px w-[54px] sm:block"
              style={{ background: 'linear-gradient(90deg, rgba(95,146,239,.8), rgba(95,146,239,0))' }}
            />
          </div>

          <h1
            className="mb-[30px] font-medium"
            style={{
              // Scaled down from the imported design's 76px cap so the
              // headline stops crowding the subcopy and CTAs. The vh term is
              // not in the design either: without it the cap holds on a short
              // laptop viewport and the copy column outgrows the one screen
              // the hero is meant to fit.
              fontSize: 'clamp(34px, min(3.8vw, 6.6vh), 56px)',
              lineHeight: 1.06,
              letterSpacing: '-.028em',
              textWrap: 'balance',
            }}
          >
            {HEADLINE_LINES.map((line) => (
              <span
                key={line.key}
                className="hero-anim block"
                style={{
                  animation: `hero-rise-in .9s cubic-bezier(.2,.7,.2,1) ${line.delay} both`,
                }}
              >
                {line.content}{' '}
              </span>
            ))}
          </h1>

          <p
            className="hero-anim mb-[34px] max-w-[470px] text-[15.5px] leading-[1.7]"
            style={{ color: DIM, animation: 'hero-fade-in 1s ease .5s both' }}
          >
            I design and develop web applications, streamline complex workflows, and turn ideas
            into reliable, user-focused products.
          </p>

          <div
            className="hero-anim flex flex-wrap gap-3.5"
            style={{ animation: 'hero-fade-in 1s ease .62s both' }}
          >
            <a
              href="#projects"
              className="inline-flex items-center gap-2.5 px-[26px] py-[15px] font-mono text-[11px] tracking-[0.22em] transition-[background,box-shadow] duration-200 hover:bg-[#4a86f2] hover:shadow-[0_14px_42px_rgba(50,120,245,.55),inset_0_0_0_1px_rgba(190,220,255,.6)]"
              style={{
                background: '#2f6fe0',
                color: '#f2f7ff',
                boxShadow: '0 10px 34px rgba(30,90,215,.4), inset 0 0 0 1px rgba(160,200,255,.35)',
              }}
            >
              → SEE MY WORK
            </a>
            {/* The design links this at a #resume placeholder; the real
                downloadable PDF is what actually ships. */}
            <a
              href="/skuganesan_resume.pdf"
              download
              className="inline-flex items-center gap-2.5 px-[26px] py-[15px] font-mono text-[11px] tracking-[0.22em] transition-colors duration-200 hover:border-[rgba(140,190,255,.85)] hover:bg-[rgba(20,48,96,.55)] hover:text-[#eaf2ff]"
              style={{
                color: '#b7cbe9',
                border: '1px solid rgba(96,150,245,.42)',
                background: 'rgba(10,24,48,.5)',
              }}
            >
              ↓ DOWNLOAD RÉSUMÉ
            </a>
          </div>

          <div
            aria-hidden="true"
            className="mt-11 flex items-center gap-4 font-mono text-[9px] tracking-[0.26em]"
            style={{ color: FAINTEST }}
          >
            <span className="inline-block h-[9px] w-px" style={{ background: FAINTEST }} />
            <span className="whitespace-nowrap">STA 000 · HOME</span>
            <span
              className="h-px max-w-[120px] flex-1"
              style={{
                background: 'repeating-linear-gradient(90deg, #2f4c78 0 4px, transparent 4px 8px)',
              }}
            />
            {/* The coordinates are the first thing to go on narrow screens —
                at 390px the row wraps into two ragged lines with it. */}
            <span className="hidden whitespace-nowrap sm:inline">CYYZ N 43.6777° W 79.6248°</span>
          </div>
        </div>

        {/* Decorative scene: dozens of unlabelled glyphs and mock UI chrome
            that would be noise read aloud, so the whole subtree is hidden
            from assistive tech rather than annotated piece by piece. */}
        <div
          ref={boxRef}
          aria-hidden="true"
          className="relative min-h-[380px] lg:h-full lg:min-h-[520px]"
        >
          {/* Absolutely positioned on purpose: `scale()` does not shrink an
              element's layout box, so an in-flow stage would reserve its full
              unscaled 900x760 here and push the footer off-screen no matter
              how far down it had been scaled. Out of flow, the box is sized
              by the copy column beside it and --fit is measured against the
              space actually available. */}
          <div
            ref={stageRef}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: 'translate(-50%, -50%) scale(var(--fit, 1))',
              transformOrigin: 'center center',
            }}
          >
            <HeroStage />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[34px] top-1/2 z-[6] hidden -translate-y-1/2 flex-col gap-[7px] font-mono text-[9px] tracking-[0.3em] lg:flex"
        style={{ color: '#33507e' }}
      >
        <span>BUILD</span>
        <span>SOLVE</span>
        <span>IMPROVE</span>
        <span>REPEAT</span>
      </div>

      {/* pb-24 clears NavRail's fixed bottom bar on mobile; from md up that
          rail moves to the right edge, so the design's own 26px is enough. */}
      <footer
        className="relative z-[6] flex items-center justify-between gap-5 px-6 pb-24 font-mono text-[9.5px] tracking-[0.24em] md:px-[34px] md:pb-[26px]"
        style={{ color: FAINT }}
      >
        <div className="flex items-center gap-3.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: '#4fbf6a', boxShadow: '0 0 9px rgba(79,191,106,.9)' }}
          />
          <span>BASED IN CANADA · OPEN TO OPPORTUNITIES</span>
        </div>
        <div aria-hidden="true" className="hidden flex-col items-center gap-2 sm:flex">
          <span style={{ color: '#33507e' }}>SCROLL</span>
          <span
            className="relative h-[34px] w-px overflow-hidden"
            style={{ background: 'rgba(96,150,245,.22)' }}
          >
            <span
              className="hero-anim absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, transparent, #7fb0ff, transparent)',
                animation: 'hero-scroll-tick 2.4s ease-in-out infinite',
              }}
            />
          </span>
        </div>
        <div className="hidden md:block">TURNING COMPLEXITY INTO SIMPLE SOLUTIONS →</div>
      </footer>
    </section>
  );
}
