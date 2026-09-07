import { motion } from 'framer-motion';
import { blueprintGrid, btnPrimary } from '../styles/shared';
import { staggerContainer, staggerItem } from './Reveal';
import { HeroGraphic } from './hero/HeroGraphic';

export function Hero() {
  return (
    <section
      id="hero"
      // pb-16 gives the bottom info bar breathing room above NavRail's fixed
      // bottom bar on short mobile viewports (see the SCROLL hint below for
      // the rest of that story); from md up NavRail is a right-edge rail
      // instead, so the normal pb-10 is enough.
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b1322] px-6 pb-16 pt-8 md:px-10 md:pb-10"
    >
      <div aria-hidden="true" className={blueprintGrid} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_8%,rgba(46,86,158,0.35),rgba(11,19,34,0)_62%)]"
      />

      {/* Decorative lockup + flourish only — NavRail (fixed, elsewhere on
          the page) is the one real section nav, so this row doesn't repeat
          it as a second set of links. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-start justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded border border-accent-text/40 font-display text-lg text-accent-text">
            SK
          </div>
          <div>
            <p className="font-display text-sm tracking-wide text-ink">SEARAN KUGANESAN</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent-text">SOFTWARE ENGINEER</p>
          </div>
        </div>
        <div className="hidden text-right font-mono text-[10px] leading-relaxed tracking-[0.2em] text-ink-dim sm:block">
          <p>BUILD</p>
          <p>SOLVE</p>
          <p>IMPROVE</p>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center py-6 md:py-10">
        {/* lg:pr-28 keeps the graphic clear of NavRail's vertical rail,
            which floats fixed at right-6 from md up (see the RAIL_GUTTER
            comment in Experience.tsx for the same gutter, needed there for
            the same reason). */}
        <div className="grid w-full items-center gap-16 lg:grid-cols-2 lg:pr-16 xl:pr-28">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.p variants={staggerItem} className="font-mono text-xs tracking-widest text-accent-text">
              // SOFTWARE ENGINEER
            </motion.p>
            <motion.h1
              variants={staggerItem}
              className="mt-4 font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-display-lg lg:leading-[1.05]"
            >
              I build <span className="text-accent-text">scalable systems</span> that create real
              impact.
            </motion.h1>
            <motion.p variants={staggerItem} className="mt-6 max-w-lg text-base text-ink-dim">
              I design and develop web applications, streamline complex workflows, and turn ideas
              into reliable, user-focused products.
            </motion.p>
            <motion.div variants={staggerItem} className="mt-8 flex flex-wrap items-center gap-4">
              <motion.a
                href="#projects"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={btnPrimary}
              >
                → See My Work
              </motion.a>
              <motion.a
                href="/skuganesan_resume.pdf"
                download
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors duration-150 hover:border-accent-text hover:text-accent-text"
              >
                ↓ Download Résumé
              </motion.a>
            </motion.div>
          </motion.div>

          <HeroGraphic />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 flex flex-wrap items-center gap-6 font-mono text-[10px] tracking-widest text-ink-dim"
      >
        <span>BASED IN CANADA · OPEN TO OPPORTUNITIES</span>
        <span className="h-px min-w-8 flex-1 bg-border" />
        <span className="hidden sm:inline">TURNING COMPLEXITY INTO SIMPLE SOLUTIONS →</span>
      </motion.div>

      {/* Hidden below md: this hero runs taller than 100vh there once the
          stats row and bottom info bar are in play, and whatever sits at
          the very end of the section is exactly what NavRail's fixed
          bottom bar covers — the bar itself already signals "more below"
          on mobile, so this hint would either get hidden behind it or
          require compressing everything above just to keep it clear. */}
      <div
        aria-hidden="true"
        className="relative z-10 mt-4 hidden text-center font-mono text-[10px] tracking-[0.2em] text-ink-dim md:block"
      >
        SCROLL
      </div>
    </section>
  );
}
