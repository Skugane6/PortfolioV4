import { motion, useReducedMotion, type Variants } from 'framer-motion';

/**
 * The mid-page sheet header: an oversized outline word, the § label sitting on
 * top of it between two mirrored rules, and an optional caption underneath.
 *
 * This markup used to be copy-pasted three times (Projects, Skills, Contact),
 * byte-identical apart from the word and the label, which is how the three
 * copies stayed in sync — by nobody touching them. It also carried a defect in
 * triplicate: the outline word ran straight *through* the label at full
 * strength, so "§ 02 · PROJECTS" was read against a lattice of 190px letter
 * strokes and both halves came out muddy. See MASK below for the fix.
 */

// Punches a soft hole in the middle of the outline word, exactly where the
// label row lands. The letters stay legible as a word at the edges and fade to
// nothing behind the text, so the label reads off clean ground instead of off
// a stroke — without needing an opaque plate behind it, which would have shown
// as a rectangle against the section's drifting grid.
const MASK = 'radial-gradient(58% 66% at 50% 54%, transparent 34%, #000 88%)';

const ghostVariants: Variants = {
  hidden: { opacity: 0, scale: 0.965 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

// The rules draw outward from the label rather than fading in place, so the
// header assembles the way it would be drawn: word, then title, then the
// registration lines out to either side.
const ruleVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 } },
};

const labelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const captionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, delay: 0.28 } },
};

interface SectionHeadingProps {
  /** The oversized outline word behind the label. Decorative — aria-hidden. */
  word: string;
  /** The visible heading, e.g. "§ 02 · PROJECTS". Rendered as the section h2. */
  label: string;
  /** Optional drafting caption under the rule row. */
  caption?: string;
}

export function SectionHeading({ word, label, caption }: SectionHeadingProps) {
  // MotionConfig(reducedMotion="user") in App strips the transform half of a
  // variant but keeps the opacity half, which is the right default nearly
  // everywhere — except for the two rules here, whose entire animation *is* a
  // transform (scaleX 0 -> 1). Rather than depend on how the config resolves a
  // transform-only variant, this drops the whole animation explicitly, the
  // same way Reveal does. Static header, fully visible.
  const shouldReduceMotion = useReducedMotion();
  const animate = shouldReduceMotion
    ? {}
    : { initial: 'hidden' as const, whileInView: 'visible' as const };

  return (
    <motion.div {...animate} viewport={{ once: true, margin: '-12% 0px' }}>
      <div className="relative">
        {/* Decorative only — aria-hidden, and each section's own
            overflow-hidden is what clips it on a narrow viewport. */}
        <motion.div
          aria-hidden="true"
          variants={ghostVariants}
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
            WebkitMaskImage: MASK,
            maskImage: MASK,
            pointerEvents: 'none',
            userSelect: 'none',
            willChange: 'transform, opacity',
          }}
        >
          {word}
        </motion.div>

        {/* relative so the label row stacks above the outline */}
        <div className="relative flex items-center justify-center gap-4 sm:gap-5">
          <motion.span
            aria-hidden="true"
            variants={ruleVariants}
            className="block h-px w-full max-w-[110px] shrink origin-right"
            style={{
              background: 'linear-gradient(90deg,transparent,#2f6ad4)',
              willChange: 'transform',
            }}
          />
          <motion.h2
            variants={labelVariants}
            className="whitespace-nowrap font-mono text-[15px] tracking-[.26em] text-accent-text sm:text-[18px] sm:tracking-[.3em]"
            style={{ willChange: 'transform, opacity' }}
          >
            {label}
          </motion.h2>
          <motion.span
            aria-hidden="true"
            variants={ruleVariants}
            className="block h-px w-full max-w-[110px] shrink origin-left"
            style={{
              background: 'linear-gradient(90deg,#2f6ad4,transparent)',
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      {caption && (
        <motion.p
          variants={captionVariants}
          className="mt-7 text-center font-mono text-[10px] tracking-[.22em] text-annotation sm:mt-8 sm:text-[11px]"
        >
          {caption}
        </motion.p>
      )}
    </motion.div>
  );
}
