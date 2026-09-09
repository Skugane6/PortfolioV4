import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { skills } from '../data/skills';
import type { Skill } from '../data/types';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';
import { SkillDetail, SkillTally } from './skills/SkillDetail';
import { SkillTile } from './skills/SkillTile';

// The grid itself doesn't move. It only meters its children, so the 28 tiles
// sweep in left-to-right, top-to-bottom rather than landing as one slab. 0.03s
// keeps the whole pass under a second even at this count.
const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.08, staggerChildren: 0.03 } },
};

export function Skills() {
  // Which tile the pointer is on, read out by the margin panel. Held here
  // rather than in the panel because it's the grid that knows.
  const [active, setActive] = useState<Skill | null>(null);

  return (
    <section
      id="skills"
      // The right gutter is 24px wider than the left from lg up, which is the
      // one place this section departs from the mirrored padding the other
      // sheets use: 160px was a hair short of the floating NavRail, so the
      // rail's plate sat on top of the seventh column of tiles. The extra
      // clears it; at this width the off-centre is imperceptible, a tile
      // disappearing under the nav was not.
      className="relative overflow-hidden bg-surface px-5 py-24 sm:px-6 sm:py-28 lg:py-section lg:pl-40 lg:pr-[184px]"
    >
      {/* Same drifting blueprint grid and corner wash the Projects section
          uses, at a lower opacity. This section sits on --color-surface rather
          than the page ground, so the grid needs less to register. */}
      <div
        aria-hidden="true"
        className="proj-anim pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(91,143,240,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(91,143,240,.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px, 64px 64px',
          animation: 'proj-drift 38s linear infinite',
        }}
      />
      {/* Three washes rather than one. The grid below is 28 different brand
          colours now, so a single blue corner glow left the plate reading cold
          against it; the amber and green lobes pick up the warm and the mint
          ends of the logo set and keep the ground in the same family as the
          thing sitting on it. All well under 20% alpha: this is ambient
          light, not a gradient anyone should be able to name. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[220px] -top-32 h-[560px] w-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(43,92,168,.16), transparent 68%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[240px] -right-[200px] h-[620px] w-[620px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(150,96,26,.11), transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[140px] left-1/3 h-[420px] w-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(30,120,92,.09), transparent 72%)' }}
      />

      <Reveal>
        <div className="relative mx-auto max-w-[1120px]">
          {/* The count is derived, so adding a skill to the data updates the
              header without anyone remembering to. */}
          <SectionHeading
            word="SKILLS"
            label="§ 03 · SKILLS"
            caption={`MATERIALS LIST · ${skills.length} ITEMS`}
          />

          {/* From xl the margin panel takes the left column and the grid the
              rest; below that the grid is the whole width. The split happens at
              xl rather than lg because at 1024px the section already gives up
              320px of side padding to clear the nav rail, and a panel on top of
              that would have squeezed the tiles under 70px. */}
          <div className="mt-9 sm:mt-11 xl:grid xl:grid-cols-[228px_minmax(0,1fr)] xl:items-start xl:gap-8">
            <SkillDetail skill={active} />

            {/* Column counts are picked so the list divides evenly and no row is
                left with a stranded tile: 28 is 4 × 7 and 7 × 4. Only the
                3-column phone layout leaves a remainder, and there the tile
                staying legible matters more than the tidy bottom edge. */}
            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-8% 0px' }}
              variants={gridVariants}
              onMouseLeave={() => setActive(null)}
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-7 xl:gap-3"
            >
              {skills.map((skill) => (
                <SkillTile key={skill.name} skill={skill} onActivate={setActive} />
              ))}
            </motion.ul>
          </div>

          {/* The panel's tally, re-laid as a row for every width that can't
              carry the panel. */}
          <div className="mt-7 border-t border-[rgba(90,130,200,.12)] pt-5 xl:hidden">
            <SkillTally layout="row" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
