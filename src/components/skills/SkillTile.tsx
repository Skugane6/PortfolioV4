import { useCallback, useState, type CSSProperties, type PointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from 'framer-motion';
import { skillMarks } from '../../data/skillIcons';
import type { Skill } from '../../data/types';

// Peak tilt, in degrees, at the corners of a tile. Small on purpose: these are
// ~90px chips in a 28-tile grid, and anything larger turns a quiet plate of
// logos into a wobbling mess as the pointer crosses it.
const TILT_MAX = 8;
const TILT_SPRING = { stiffness: 260, damping: 22, mass: 0.5 };

// Entrance. Springs rather than a duration so tiles arriving mid-stagger settle
// at slightly different rates and the grid reads as a wave, not a curtain.
const tileVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 26, mass: 0.7 },
  },
};

// The four corner brackets are drawn on rather than faded in — pathLength is
// the one property that gives a mark the look of being struck by a pen, which
// is the whole conceit of the section.
const tickVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 0.5, ease: 'easeOut' }, opacity: { duration: 0.2 } },
  },
};

const CORNERS = ['M2 12V2h10', 'M88 2h10v10', 'M98 88v10H88', 'M12 98H2V88'];

/**
 * One logo chip.
 *
 * The brand colour is deliberately *not* animated here: it's a CSS transition
 * on `.skill-mark` driven by the three custom properties set below, because
 * that's the only way the same rule can make the brand colour the *resting*
 * state under `@media (hover: none)`. A JS hover tint would leave every phone
 * looking at a grid of grey marks. Framer Motion owns what CSS does badly —
 * the staggered entrance, the pointer tilt, and the bloom/sweep on hover.
 */
export function SkillTile({ skill }: { skill: Skill }) {
  const mark = skillMarks[skill.icon];
  const shouldReduceMotion = useReducedMotion();
  const [lit, setLit] = useState(false);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, TILT_SPRING);
  const rotateY = useSpring(tiltY, TILT_SPRING);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLLIElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      // -0.5..0.5 from the tile's centre. Y drives rotateX inverted so the tile
      // leans toward the pointer rather than away from it.
      tiltX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 2 * TILT_MAX);
      tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 2 * TILT_MAX);
    },
    [tiltX, tiltY],
  );

  const rest = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
    setLit(false);
  }, [tiltX, tiltY]);

  // An alpha suffix on the hex gives the tint a weaker weight for the border
  // and the corner ticks without needing a second colour in the data.
  const brandVars = {
    '--brand': mark.hex,
    '--brand-soft': `${mark.hex}66`,
  } as CSSProperties;

  return (
    <motion.li
      variants={tileVariants}
      onPointerMove={shouldReduceMotion ? undefined : onPointerMove}
      onHoverStart={() => setLit(true)}
      onHoverEnd={rest}
      style={
        shouldReduceMotion
          ? brandVars
          : { ...brandVars, rotateX, rotateY, transformPerspective: 620 }
      }
      className="skill-tile relative list-none"
    >
      <div className="skill-chip relative flex h-full flex-col items-center gap-1 overflow-hidden rounded-xl border border-[rgba(90,130,200,.16)] bg-[rgba(12,17,26,.55)] px-2 pb-2.5 pt-3 text-center">
        {/* Brand-tinted bloom behind the mark. Scaled, not resized, so it stays
            on the compositor. */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.55 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 34%, ${mark.hex}33, transparent 68%)` }}
        />

        {/* One pass of light across the chip on hover. The un-lit state gets a
            zero-duration transition so the bar resets off-screen instead of
            visibly sliding back when the pointer leaves. */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={lit ? { x: '340%', opacity: [0, 0.9, 0] } : { x: '-160%', opacity: 0 }}
          transition={lit ? { duration: 0.8, ease: 'easeOut' } : { duration: 0 }}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4"
          // skewX lives here rather than in a Tailwind class: Motion writes the
          // whole `transform` inline while animating x, which would drop it.
          style={{ skewX: -12, background: 'linear-gradient(90deg,transparent,rgba(158,196,255,.18),transparent)' }}
        />

        {/* Corner brackets. Stroked, not filled, so pathLength can draw them.
            preserveAspectRatio="none" lets the 100x100 box stretch to whatever
            the chip's aspect ratio is; non-scaling-stroke keeps the pen weight
            even after that stretch. */}
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="skill-ticks pointer-events-none absolute inset-0 h-full w-full"
        >
          {CORNERS.map((d) => (
            <motion.path
              key={d}
              d={d}
              variants={tickVariants}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </motion.svg>

        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ scale: lit ? 1.14 : 1, y: lit ? -1 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          className="skill-mark relative block h-7 w-7 sm:h-9 sm:w-9"
        >
          {/* Static path data generated at build time by
              scripts/generate-skill-icons.mjs from vendored icon packages —
              nothing here originates from user input. */}
          <svg
            viewBox={mark.viewBox}
            role="presentation"
            className="h-full w-full"
            dangerouslySetInnerHTML={{ __html: mark.body }}
          />
        </motion.span>

        <span className="relative mt-1.5 block w-full truncate text-[11px] leading-tight text-ink sm:text-xs">
          {skill.name}
        </span>
        {skill.note ? (
          <span className="skill-note relative block w-full font-mono text-[8.5px] leading-tight tracking-wide sm:text-[9px]">
            {skill.note}
          </span>
        ) : null}
      </div>
    </motion.li>
  );
}
