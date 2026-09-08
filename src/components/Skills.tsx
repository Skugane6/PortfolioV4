import { motion, type Variants } from 'framer-motion';
import { skills } from '../data/skills';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';
import { SkillTile } from './skills/SkillTile';

// The grid itself doesn't move — it only meters its children, so the 28 tiles
// sweep in left-to-right, top-to-bottom rather than landing as one slab. 0.03s
// keeps the whole pass under a second even at this count.
const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.08, staggerChildren: 0.03 } },
};

export function Skills() {
  return (
    <section
      id="skills"
      className="relative overflow-hidden bg-surface px-5 py-24 sm:px-6 sm:py-28 lg:px-40 lg:py-section"
    >
      {/* Same drifting blueprint grid and corner wash the Projects section
          uses, at a lower opacity — this section sits on --color-surface rather
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[220px] -top-32 h-[560px] w-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(43,92,168,.16), transparent 68%)' }}
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

          {/* Column counts are picked so the list divides evenly and no row is
              left with a stranded tile: 28 is 4 × 7 and 7 × 4. Only the
              3-column phone layout leaves a remainder, and there the tile
              staying legible matters more than the tidy bottom edge. */}
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8% 0px' }}
            variants={gridVariants}
            className="mt-9 grid grid-cols-3 gap-2 sm:mt-11 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-7"
          >
            {skills.map((skill) => (
              <SkillTile key={skill.name} skill={skill} />
            ))}
          </motion.ul>
        </div>
      </Reveal>
    </section>
  );
}
