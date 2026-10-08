import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { CSSProperties } from 'react';
import { skillMarks } from '../../data/skillIcons';
import { skillGroupOrder, skillGroups, skills } from '../../data/skills';
import type { Skill, SkillGroup } from '../../data/types';

/**
 * One hue per run of the parts list. These are the section's own colours, not
 * anybody's brand. They exist so the tally reads as four measured quantities
 * at a glance instead of four numbers, and so the panel keeps some colour in
 * it while no tile is under the pointer. All four clear 4.5:1 on the plate.
 */
const GROUP_HUES: Record<SkillGroup, string> = {
  build: '#5B8FF0',
  platform: '#F0A02A',
  data: '#3FCF8E',
  verify: '#B57BEE',
};

const TALLY = skillGroupOrder.map((group) => ({
  group,
  count: skills.filter((skill) => skill.group === group).length,
}));

const TALLY_MAX = Math.max(...TALLY.map((row) => row.count));

const pad = (n: number) => String(n).padStart(2, '0');

// The readout swaps by *remounting* on a changed key, deliberately not
// <AnimatePresence mode="wait">, which was the first thing tried here and which
// wedges: sweep a pointer across the grid fast enough and a new key arrives
// mid-exit, after which the panel stops updating entirely and holds whatever
// part it was showing. Dropping the exit half removes the failure mode and
// costs nothing visible: the outgoing part is behind the incoming one either
// way, and a 180ms rise reads as a swap without it.
const swapVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
};

const CORNERS = ['M1 11V1h10', 'M89 1h10v10', 'M99 89v10H89', 'M11 99H1V89'];

/**
 * `swatch` paints the colour rather than the text. The brand hexes are floored
 * to 3:1 for graphics, not the 4.5:1 body text wants, so setting the FINISH row
 * *in* its own colour would put half the list under AA. The chip carries the
 * colour and the value stays ink.
 */
function SpecRow({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-[rgba(90,130,200,.12)] py-1.5">
      <span className="font-mono text-[9px] tracking-[.18em] text-annotation-dim">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        {swatch && (
          <span
            aria-hidden="true"
            className="block h-2 w-2 shrink-0 rounded-[1px]"
            style={{ background: swatch, boxShadow: `0 0 7px ${swatch}` }}
          />
        )}
        <span className="truncate font-mono text-[10px] tracking-wide text-ink">{value}</span>
      </span>
    </div>
  );
}

/**
 * The tally of the four runs, as labelled bars.
 *
 * Rendered twice: down the side panel from xl up, and as a wrapped row under
 * the grid below that: the counts are the one piece of the readout that says
 * something a tile can't, so they shouldn't vanish on a laptop or a phone just
 * because there is no margin to park a panel in.
 */
export function SkillTally({ layout }: { layout: 'column' | 'row' }) {
  const column = layout === 'column';
  // The bar's whole animation is a scaleX, and <MotionConfig reducedMotion>
  // strips transforms rather than finishing them, the same trap SectionHeading
  // documents. Drawn at full length instead, so the tally still reads.
  const shouldReduceMotion = useReducedMotion();

  return (
    <ul
      className={
        column
          ? 'mt-3 space-y-2.5'
          : 'flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8'
      }
    >
      {TALLY.map(({ group, count }) => (
        <li key={group} className={column ? 'block' : 'flex items-center'}>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="block h-1.5 w-1.5 shrink-0 rounded-[1px]"
              style={{ background: GROUP_HUES[group], boxShadow: `0 0 6px ${GROUP_HUES[group]}` }}
            />
            <span className="font-mono text-[9px] tracking-[.16em] text-annotation">
              {skillGroups[group].label}
            </span>
            <span className="ml-auto pl-1 font-mono text-[9px] tracking-wide text-annotation-dim">
              {pad(count)}
            </span>
          </div>
          {/* The bar is column-only: in the row layout the four labels already
              sit side by side, so a second horizontal comparison would just be
              the same reading twice. */}
          {column && (
            <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-[rgba(90,130,200,.12)]">
              <motion.span
                className="block h-full origin-left rounded-full"
                {...(shouldReduceMotion
                  ? {}
                  : {
                      initial: { scaleX: 0 },
                      whileInView: { scaleX: count / TALLY_MAX },
                      viewport: { once: true },
                      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 },
                    })}
                style={{
                  width: shouldReduceMotion ? `${(count / TALLY_MAX) * 100}%` : '100%',
                  background: `linear-gradient(90deg, ${GROUP_HUES[group]}, ${GROUP_HUES[group]}55)`,
                }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * The drawing's detail callout: the margin panel that reads out whichever tile
 * the pointer is on: its mark at full size in its own brand colour, which run
 * of the list it belongs to, the colour it is painted in, and its number in the
 * parts list. With nothing under the pointer it holds a resting state rather
 * than collapsing, so the column never changes height as the cursor moves.
 *
 * xl and up only. Below that there is no margin to put it in without taking
 * width off the grid, and the tile itself already prints the name and note.
 * Only the tally moves down under the grid (see SkillTally).
 */
export function SkillDetail({ skill }: { skill: Skill | null }) {
  const mark = skill ? skillMarks[skill.icon] : null;
  const index = skill ? skills.findIndex((entry) => entry.name === skill.name) + 1 : 0;

  const brandVars = {
    '--brand': mark?.hex ?? 'rgba(150,178,215,.72)',
    '--brand-soft': mark ? `${mark.hex}66` : 'rgba(90,130,200,.18)',
    '--brand-line': mark ? `${mark.hex}3a` : 'rgba(90,130,200,.16)',
    '--brand-wash': mark ? `${mark.hex}14` : 'rgba(90,130,200,.05)',
  } as CSSProperties;

  return (
    <aside
      style={brandVars}
      className="skill-detail hidden xl:sticky xl:top-24 xl:block xl:self-start"
    >
      <p className="font-mono text-[9px] tracking-[.24em] text-annotation">DETAIL · A–A</p>

      {/* Preview plate. Fixed aspect ratio, so the panel never reflows as marks
          of different proportions swap through it. */}
      <div className="skill-detail-plate relative mt-2.5 aspect-[4/3] w-full overflow-hidden rounded-lg border">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(91,143,240,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(91,143,240,.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px, 16px 16px',
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-[background] duration-500"
          style={{ background: 'radial-gradient(circle at 50% 46%, var(--brand-soft), transparent 62%)' }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="skill-detail-ticks pointer-events-none absolute inset-0 h-full w-full"
        >
          {CORNERS.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          {mark ? (
            <motion.span
              key={skill?.name}
              variants={swapVariants}
              initial="hidden"
              animate="visible"
              className="skill-detail-mark block h-14 w-14"
            >
              {/* The same generated, static path data the grid draws. */}
              <svg
                viewBox={mark.viewBox}
                role="presentation"
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: mark.body }}
              />
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              variants={swapVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-2 text-annotation-dim"
            >
              <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1}>
                <circle cx="16" cy="16" r="9" />
                <path d="M16 1v9M16 22v9M1 16h9M22 16h9" />
              </svg>
              <span className="font-mono text-[8.5px] tracking-[.18em]">NO PART SELECTED</span>
            </motion.span>
          )}
        </div>
      </div>

      {/* The name/spec block is aria-hidden: every word of it is already in the
          tile the pointer is sitting on, and a region that rewrites itself 28
          times as a mouse crosses a grid is noise to a screen reader. */}
      <div aria-hidden="true" className="mt-3 min-h-[136px]">
        <motion.div key={skill?.name ?? 'idle'} variants={swapVariants} initial="hidden" animate="visible">
          <p className="skill-detail-name truncate font-display text-[19px] uppercase leading-tight tracking-wide">
            {skill?.name ?? 'Materials list'}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] leading-relaxed text-ink-dim">
            {skill?.note ?? 'Hover any tile for its detail'}
          </p>

          <div className="mt-3">
            <SpecRow label="RUN" value={skill ? skillGroups[skill.group].label : '··'} />
            <SpecRow label="FINISH" value={mark ? mark.hex : '··'} swatch={mark?.hex} />
            <SpecRow
              label="ITEM"
              value={skill ? `${pad(index)} / ${skills.length}` : `·· / ${skills.length}`}
            />
          </div>
        </motion.div>
      </div>

      <div className="mt-4 border-t border-[rgba(90,130,200,.14)] pt-3">
        <p className="font-mono text-[9px] tracking-[.24em] text-annotation">SCHEDULE</p>
        <SkillTally layout="column" />
      </div>
    </aside>
  );
}
