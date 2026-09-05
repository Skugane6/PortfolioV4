import { motion } from 'framer-motion';
import { skillGroups } from '../data/skills';
import { Reveal, Stagger, staggerItem } from './Reveal';
import { chipWash } from '../styles/shared';

export function Skills() {
  return (
    <section id="skills" className="bg-surface px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 03 · SKILLS</p>
          <Stagger className="mt-8 grid gap-10 md:grid-cols-2">
            {skillGroups.map((group) => (
              <motion.div key={group.id} variants={staggerItem}>
                <h3 className="font-display text-xl text-ink">{group.title}</h3>
                <Stagger className="mt-3 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <motion.span
                      key={skill}
                      variants={staggerItem}
                      whileHover={{ scale: 1.08, y: -2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={chipWash}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </Stagger>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </Reveal>
    </section>
  );
}
