import { motion } from 'framer-motion';
import { experience, education } from '../data/experience';
import { secondaryProjects } from '../data/projects';
import { Reveal, Stagger, staggerItem } from './Reveal';
import { cardSurface } from '../styles/shared';

const cardHover = { y: -4 };
const cardHoverTransition = { type: 'spring' as const, stiffness: 300, damping: 25 };

export function Experience() {
  return (
    <section id="experience" className="bg-bg px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 02 · EXPERIENCE</p>

          <Stagger className="mt-8 space-y-10">
            {experience.map((role) => (
              <motion.article key={role.company} variants={staggerItem} className="border-l border-border pl-6">
                <p className="font-mono text-xs tracking-widest text-ink-dim">
                  {role.start} – {role.end}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl text-ink">
                    {role.role} · {role.company}
                  </h3>
                  {role.logo && (
                    <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5">
                      <img src={role.logo} alt={`${role.company} logo`} className="h-5 w-auto md:h-6" />
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-dim">{role.location}</p>
                <ul className="mt-4 space-y-2 text-ink">
                  {role.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </Stagger>

          <div className="mt-16">
            <p className="font-mono text-xs tracking-widest text-ink-dim">ALSO BUILT</p>
            <Stagger className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {secondaryProjects.map((project) => {
                const Card = (
                  <div className={`h-full overflow-hidden transition-colors hover:border-accent ${cardSurface}`}>
                    {project.image && (
                      <img
                        src={project.image}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="aspect-[5/3] w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h4 className="font-display text-lg text-ink">{project.name}</h4>
                      <p className="mt-2 text-sm text-ink-dim">{project.tagline}</p>
                      <p className="mt-3 font-mono text-[10px] tracking-widest text-ink-dim">
                        {project.stack.join(' · ')}
                      </p>
                    </div>
                  </div>
                );

                return project.href ? (
                  <motion.a
                    key={project.id}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    variants={staggerItem}
                    whileHover={cardHover}
                    transition={cardHoverTransition}
                    className="block"
                  >
                    {Card}
                  </motion.a>
                ) : (
                  <motion.div
                    key={project.id}
                    variants={staggerItem}
                    whileHover={cardHover}
                    transition={cardHoverTransition}
                  >
                    {Card}
                  </motion.div>
                );
              })}
            </Stagger>
          </div>

          <p className="mt-12 font-mono text-xs tracking-widest text-ink-dim">
            {education.program}, {education.school} · {education.graduation}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
