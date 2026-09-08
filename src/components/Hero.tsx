import portrait from '../assets/hero.jpg';
import { useStageTilt } from '../hooks/useStageTilt';
import { HeroStage } from './hero/HeroStage';
import { IdeFrame } from './hero/IdeFrame';

// The hero runs its own palette rather than the site tokens in index.css.
// It is a full-bleed section that vignettes to near-black at every edge, so
// it seats cleanly above --color-bg without the two having to match, and
// diluting these values into the shared tokens would drag the rest of the
// site's blues along with them.
const INK = '#e6eefc';
const ACCENT = '#5b95ef';
const DIM = '#93a9ca';

// Three tiers of blue-grey, split by what the text actually has to do.
// MICRO carries real information at 9-11px, so it is the only one held to a
// readable ratio against #050b16 (6.7:1); LINE and MARK are chrome — rules,
// tick marks, registration crosses — and are allowed to sit near the floor.
const MICRO = '#7fa3dd';
const LINE = '#5b86cc';
const MARK = 'var(--color-annotation-dim)';

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

// A spec sheet for the engineer, not for an employer: what he ships, what he
// ships it in, the credential, and the one thing running in production.
//
// Deliberately not a count of implementation details — table counts and
// integration counts measure how big a thing is, not whether it was worth
// building, and they read as filler in a hero. Values stay short: the strip
// works as an instrument readout only while the figure is a single glance.
interface Metric {
  label: string;
  /** The readout itself. Exactly one of `value` or `logo`. */
  value?: string;
  logo?: { src: string; alt: string; width: number; height: number };
  href?: string;
  accent?: boolean;
}

const METRICS: Metric[] = [
  // Total shipped, which is more than the four case studies projects.ts
  // chooses to write up — so this figure is Searan's, not derived.
  { value: '10', label: 'PROJECTS SHIPPED' },
  // The mark is the whole readout here: the lockup already says "Western", so
  // printing a caption under it would be the school's name twice. `label` is
  // still carried — it becomes the term a screen reader hears, since the
  // image itself is then decorative.
  {
    logo: { src: '/western-mark.png', alt: '', width: 1025, height: 243 },
    label: 'WESTERN UNIVERSITY',
  },
  // education in experience.ts.
  { value: '2026', label: 'B.E.SC SOFTWARE ENG' },
  { value: 'LIVE', label: 'CRAFTTRAQ SAAS', href: 'https://crafttraq.com', accent: true },
];

const SOCIALS = [
  {
    label: 'GitHub',
    href: 'https://github.com/skugane6',
    path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/searan-kuganesan',
    path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  },
  {
    label: 'Email',
    href: 'mailto:searan.kuganesan4@gmail.com',
    path: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7',
  },
];

export function Hero() {
  const { sectionRef, boxRef, stageRef } = useStageTilt();

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col overflow-hidden font-sans"
      // svh rather than vh: on mobile Safari/Chrome the 100vh box is taller
      // than the visible viewport by the height of the retracted URL bar, so
      // a hero built to fit one screen still starts out clipped under vh.
      style={{ background: '#050b16', color: INK, minHeight: '100svh' }}
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
      {/* Below lg the stage is not rendered, so the glow moves off the empty
          right column and sits behind the copy instead — otherwise the one
          light source in the scene ends up lighting nothing. */}
      <div
        aria-hidden="true"
        className="hero-anim pointer-events-none absolute -right-[25%] top-0 h-[60vh] w-[130vw] lg:-right-[6%] lg:top-[8%] lg:h-[72vh] lg:w-[62vw]"
        style={{
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

      {/* Everything readable lives in one measured column; only the grid, the
          glow and the vignette stay full-bleed. Past ~1720px the two-column
          grid was spreading a 640px paragraph and a 900px scene across 2.5k
          of screen, which left the proof strip's four cells 450px apart and
          reading as four unrelated numbers. Capping the column keeps the
          corner chrome anchored to the content it frames rather than to the
          monitor. Below the cap this is inert. */}
      <div className="relative z-[5] mx-auto flex w-full max-w-[1720px] flex-1 flex-col">
      {/* Decorative lockup only — NavRail (fixed, rendered from App) remains
          the one real section nav, so the imported design's own right-edge
          nav is deliberately not reproduced here. */}
      <header className="relative z-[6] flex items-start justify-between gap-4 px-6 pt-[26px] md:px-[34px] [@media(max-height:520px)]:pt-3">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-[42px] w-[42px] flex-none items-center justify-center font-mono text-sm tracking-[0.06em]"
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
            <div className="font-mono text-[9px] tracking-[0.28em]" style={{ color: LINE }}>
              SOFTWARE ENGINEER
            </div>
          </div>
        </div>
        {/* Availability is the one piece of status worth reading first, so it
            takes the slot the old BUILD/SOLVE/IMPROVE triad held — that triad
            already runs down the left edge on lg, and printing it twice on a
            wide screen was the duplication, not a motif. */}
        <div
          className="hidden flex-none items-center gap-2.5 px-3 py-2 font-mono text-[9px] tracking-[0.24em] sm:flex"
          style={{
            color: MICRO,
            border: '1px solid rgba(96,150,245,.28)',
            background: 'rgba(10,24,48,.5)',
          }}
        >
          <span
            className="h-1.5 w-1.5 flex-none rounded-full"
            style={{ background: '#4fbf6a', boxShadow: '0 0 9px rgba(79,191,106,.9)' }}
          />
          OPEN TO OPPORTUNITIES
        </div>
      </header>

      {/* Columns stretch rather than centre so the stage's box inherits the
          copy column's height — that height is what --fit is measured
          against, and centring would leave it at its bare minimum. */}
      <div className="relative grid flex-1 gap-5 px-6 pt-4 [@media(max-height:520px)]:pt-2 md:px-[34px] lg:grid-cols-2 lg:pl-[40px] lg:pr-[150px] lg:pt-6 xl:pl-[108px] xl:pr-[160px]">
        <div className="relative max-w-[640px] self-center pl-[22px]">
          <div
            aria-hidden="true"
            className="absolute bottom-1.5 left-0 top-1.5 w-px"
            style={{
              background: 'linear-gradient(180deg, rgba(96,150,245,.7), rgba(96,150,245,0))',
            }}
          />

          <div
            className="hero-anim mb-5 flex items-center gap-4 lg:mb-[26px] [@media(max-height:520px)]:mb-2"
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
              className="h-[54px] w-[54px] flex-none rounded-full object-cover lg:h-[60px] lg:w-[60px] [@media(max-height:520px)]:h-10 [@media(max-height:520px)]:w-10"
              style={{
                border: '1px solid rgba(96,150,245,.55)',
                boxShadow: '0 0 18px rgba(40,100,220,.35)',
              }}
            />
            {/* Not "// SOFTWARE ENGINEER": the lockup two rows above already
                says that, so this line spends itself on the specialisation
                instead of repeating the title. */}
            <span
              className="font-mono text-[9.5px] tracking-[0.2em] sm:text-[11px] sm:tracking-[0.34em] lg:text-[10px] lg:tracking-[0.22em] xl:text-[11px] xl:tracking-[0.34em]"
              style={{ color: '#5f92ef' }}
            >
              // FULL-STACK &amp; DATA SYSTEMS
            </span>
            {/* Trailing flourish; the portrait plus the label already fill the
                row at 390px, so it only appears once there is space for it. */}
            <span
              aria-hidden="true"
              className="hidden h-px flex-1 sm:block"
              style={{ background: 'linear-gradient(90deg, rgba(95,146,239,.8), rgba(95,146,239,0))' }}
            />
          </div>

          <h1
            className="mb-5 font-medium lg:mb-[26px] [@media(max-height:520px)]:mb-3"
            style={{
              // Three-way clamp. The vw term gives the headline the presence a
              // 1920 screen has room for (the old flat 56px cap left it
              // stranded), the vh term keeps it from eating a short laptop
              // viewport, and the floor keeps four forced lines legible at
              // 360px.
              fontSize: 'clamp(32px, min(4.6vw, 7.4vh), 72px)',
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
            className="hero-anim mb-5 max-w-[500px] text-[15px] leading-[1.65] sm:text-[15.5px] sm:leading-[1.7] lg:mb-[30px] [@media(max-height:520px)]:mb-3"
            style={{ color: DIM, animation: 'hero-fade-in 1s ease .5s both' }}
          >
            I design and develop web applications, streamline complex workflows, and turn ideas
            into reliable, user-focused products.
          </p>

          <div
            className="hero-anim flex flex-wrap items-center gap-3"
            style={{ animation: 'hero-fade-in 1s ease .62s both' }}
          >
            <a
              href="#projects"
              className="inline-flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap px-5 py-[15px] font-mono text-[11px] tracking-[0.18em] transition-[background,box-shadow] duration-200 hover:bg-[#3570e2] hover:shadow-[0_14px_42px_rgba(50,120,245,.55),inset_0_0_0_1px_rgba(190,220,255,.6)] sm:flex-none sm:justify-start sm:px-5 sm:tracking-[0.22em] lg:px-4 xl:px-[26px]"
              // The page's one primary CTA, so its label has to clear AA in
              // both states. It did not: #f2f7ff on #2f6fe0 is 4.37:1 at rest
              // and the old #4a86f2 hover dropped it to 3.26:1 — the button
              // got *less* legible the moment you pointed at it. Deepening the
              // rest fill and promoting the old rest colour to the hover fill
              // keeps the same blue and the same "brightens on hover" read,
              // at 5.6:1 and 4.6:1 against pure white.
              style={{
                background: '#2a63cf',
                color: '#ffffff',
                boxShadow: '0 10px 34px rgba(30,90,215,.4), inset 0 0 0 1px rgba(160,200,255,.35)',
              }}
            >
              <Icon path="M5 12h14M13 6l6 6-6 6" />
              SEE MY WORK
            </a>
            {/* The design links this at a #resume placeholder; the real
                downloadable PDF is what actually ships. */}
            <a
              href="/skuganesan_resume.pdf"
              download
              className="inline-flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap px-5 py-[15px] font-mono text-[11px] tracking-[0.18em] transition-colors duration-200 hover:border-[rgba(140,190,255,.85)] hover:bg-[rgba(20,48,96,.55)] hover:text-[#eaf2ff] sm:flex-none sm:justify-start sm:px-5 sm:tracking-[0.22em] xl:px-[26px]"
              style={{
                color: '#b7cbe9',
                border: '1px solid rgba(96,150,245,.42)',
                background: 'rgba(10,24,48,.5)',
              }}
            >
              <Icon path="M12 3v12M7 11l5 5 5-5M4 20h16" />
              DOWNLOAD RÉSUMÉ
            </a>

          </div>

          {/* Its own row rather than a third item in the button group: at the
              copy column's widest the two CTAs plus three 44px targets exceed
              it, and a wrap that only happens on some viewports left a stray
              divider hanging off the end of the button row.
              -ml-3 pulls the first glyph's 44px box back so the icon itself,
              not its padding, lines up with the CTA edge above. */}
          <div
            className="hero-anim -ml-3 mt-1 flex items-center lg:mt-2"
            style={{ animation: 'hero-fade-in 1s ease .7s both' }}
          >
            {/* 44x44 hit areas: the glyph is 18px and the rest is padding,
                which is what keeps these thumb-usable without drawing a
                button around each one. */}
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noreferrer' : undefined}
                className="inline-flex h-11 w-11 items-center justify-center transition-colors duration-200 hover:text-[#cfe0fb]"
                style={{ color: MICRO }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Stand-in for the stage from 768 to 1279. The full scene is authored
            at 900x760 and auto-fits to a 0.40 floor, so below xl it arrived
            either as a weedy thumbnail (two columns at 1024) or with nowhere
            to go at all (one column at 768) — and leaving the slot empty gave
            the widest single-column case a 180px void under the CTAs. The IDE
            is the part of the scene that survives being lifted out of the 3D
            stack: it is fluid, it keeps its chrome, and it holds up at a size
            these viewports can actually give it.

            Two queries, because the two layouts it serves have different
            vertical budgets — stacked under the copy it has to earn its
            height, beside the copy it costs none. Both fold the width bounds
            into the media query rather than pairing a `hidden` with an
            `xl:hidden`, so there is no specificity race to lose. The height
            floor is also what keeps a landscape phone (844x390, "md" by
            width) from being buried under a 240px panel. */}
        <div
          aria-hidden="true"
          className="mx-auto hidden h-[252px] w-full max-w-[560px] self-center lg:h-[320px] lg:pl-7 [@media(min-width:1024px)_and_(max-width:1279.98px)_and_(min-height:560px)]:block [@media(min-width:768px)_and_(max-width:1023.98px)_and_(min-height:820px)]:block"
        >
          <div className="relative h-full w-full">
            <IdeFrame />
          </div>
        </div>

        {/* Decorative scene: dozens of unlabelled glyphs and mock UI chrome
            that would be noise read aloud, so the whole subtree is hidden
            from assistive tech rather than annotated piece by piece.

            Not rendered below lg at all. The stage is authored at 900x760 and
            the auto-fit floor is 0.4, so on a phone it arrived as a 360px
            smear of 4px type that also pushed the hero to ~1.4 screens — the
            copy and the proof strip are the mobile hero. */}
        <div
          ref={boxRef}
          aria-hidden="true"
          className="relative hidden xl:block xl:h-full xl:min-h-[520px]"
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

      {/* Proof strip. It does two jobs: it puts something concrete in the
          first screen (the old hero asserted "real impact" and then showed
          none until you scrolled), and it occupies the band between the copy
          and the footer that read as dead space on anything taller than
          ~800px. */}
      <div
        className="hero-anim relative z-[6] px-6 pt-6 md:px-[34px] lg:pl-[40px] lg:pr-[150px] xl:pl-[108px] xl:pr-[160px]"
        style={{ animation: 'hero-fade-in 1s ease .74s both' }}
      >
        <div
          className="mb-4 flex items-center gap-3.5 font-mono text-[9px] tracking-[0.26em]"
          style={{ color: MICRO }}
        >
          <span aria-hidden="true" className="h-[9px] w-px flex-none" style={{ background: LINE }} />
          <span className="whitespace-nowrap">STA 000 · HOME</span>
          <span
            aria-hidden="true"
            className="h-px flex-1"
            style={{
              background: 'repeating-linear-gradient(90deg, #2f4c78 0 4px, transparent 4px 8px)',
            }}
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 sm:gap-x-6">
          {METRICS.map((metric) => {
            // dt before dd keeps the list valid; column-reverse is what puts
            // the figure above its label without inverting the markup.
            const body = (
              <div
                className="flex h-full flex-col-reverse gap-1.5 border-l pl-3.5"
                style={{ borderColor: 'rgba(96,150,245,.3)' }}
              >
                {/* A logo cell prints no caption, but its term still has to
                    occupy the label row — remove it from the flow and the
                    mark drops to where the other three print their labels,
                    ten pixels below their figures. opacity-0 rather than
                    sr-only for exactly that reason: it keeps the box, and
                    unlike visibility:hidden it keeps the term in the
                    accessibility tree, which is the only place the school's
                    name is written now. */}
                <dt
                  className={`font-mono text-[9px] tracking-[0.2em] ${
                    metric.logo ? 'select-none opacity-0' : ''
                  }`}
                  style={{ color: MICRO }}
                >
                  {metric.label}
                </dt>
                {metric.logo ? (
                  // Boxed to the figure row's own height with the mark
                  // centred on it, so a lockup that is taller than a numeral
                  // still shares their optical centre instead of shifting the
                  // whole cell.
                  <dd className="flex h-[clamp(19px,2.1vw,26px)] items-center">
                    {/* White artwork on transparency, straight onto the navy —
                        see scripts/generate-western-mark.mjs, which lifts it
                        off the purple plate Western ships it on. That plate
                        would be the only saturated block on the page; reversed
                        is how the rest of this hero's chrome is drawn.
                        Decorative alt: the term above names it, and repeating
                        it here says "Western University" twice. */}
                    <img
                      src={metric.logo.src}
                      alt={metric.logo.alt}
                      width={metric.logo.width}
                      height={metric.logo.height}
                      className="h-[26px] w-auto max-w-none opacity-95 sm:h-[30px] lg:h-[34px]"
                    />
                  </dd>
                ) : (
                  <dd
                    className="font-mono text-[clamp(19px,2.1vw,26px)] leading-none tracking-[-0.01em]"
                    style={{ color: metric.accent ? ACCENT : INK }}
                  >
                    {metric.value}
                  </dd>
                )}
              </div>
            );

            return metric.href ? (
              <a
                key={metric.label}
                href={metric.href}
                target="_blank"
                rel="noreferrer"
                className="block h-full transition-opacity duration-200 hover:opacity-75"
              >
                {body}
              </a>
            ) : (
              <div key={metric.label}>{body}</div>
            );
          })}
        </dl>
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[34px] top-1/2 z-[6] hidden -translate-y-1/2 flex-col gap-[7px] font-mono text-[9px] tracking-[0.3em] xl:flex"
        style={{ color: 'var(--color-annotation-dim)' }}
      >
        <span>BUILD</span>
        <span>SOLVE</span>
        <span>IMPROVE</span>
        <span>REPEAT</span>
      </div>

      {/* pb-24 clears NavRail's fixed bottom bar, which now holds until lg —
          that rail only becomes a right-edge column at lg, so the old md
          breakpoint here was uncovering the bar from 768 to 1023. */}
      <footer
        className="relative z-[6] mt-auto flex items-center justify-between gap-5 px-6 pb-24 pt-5 font-mono text-[9.5px] tracking-[0.24em] md:px-[34px] lg:pb-[26px] lg:pt-8"
        style={{ color: MICRO }}
      >
        {/* Availability lives in the header pill from sm up. Below that the
            pill has no room next to the lockup, so the status folds down here
            and the coordinates — the most expendable line in the hero — give
            up their slot for it. Exactly one green dot is on screen either
            way. */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 flex-none rounded-full sm:hidden"
            style={{ background: '#4fbf6a', boxShadow: '0 0 9px rgba(79,191,106,.9)' }}
          />
          <span className="whitespace-nowrap sm:hidden">OPEN TO WORK · CANADA</span>
          <span className="hidden whitespace-nowrap sm:inline">BASED IN CANADA</span>
          <span aria-hidden="true" className="hidden sm:inline" style={{ color: MARK }}>
            ·
          </span>
          <span className="hidden whitespace-nowrap sm:inline" style={{ color: LINE }}>
            CYYZ N 43.6777° W 79.6248°
          </span>
        </div>
        <div aria-hidden="true" className="hidden flex-col items-center gap-2 sm:flex">
          <span style={{ color: MARK }}>SCROLL</span>
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
        <div className="hidden whitespace-nowrap lg:block" style={{ color: LINE }}>
          TURNING COMPLEXITY INTO SIMPLE SOLUTIONS →
        </div>
      </footer>
      </div>
    </section>
  );
}

/** 16px stroked glyph for the CTA buttons — sized to sit on the mono cap height. */
function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}
