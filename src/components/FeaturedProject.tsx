import { motion } from 'framer-motion';
import { featuredProject } from '../data/projects';
import { Reveal, Stagger, staggerItem } from './Reveal';
import { cardSurface, chipStamped } from '../styles/shared';

export function FeaturedProject() {
  const project = featuredProject;

  return (
    <section id="work" className="bg-surface px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 01 · FEATURED WORK</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-display-md text-ink">{project.name}</h2>
            <span className={chipStamped}>Live</span>
          </div>
          <p className="mt-2 max-w-2xl text-ink-dim">{project.tagline}</p>

          <motion.div
            className={`relative mt-10 overflow-hidden ${cardSurface}`}
            whileHover={{ scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <picture>
              <source srcSet={project.screenshot.webp} type="image/webp" />
              <img src={project.screenshot.src} alt={project.screenshot.alt} loading="lazy" className="w-full" />
            </picture>
          </motion.div>

          <Stagger className="mt-12 grid gap-10 md:grid-cols-2">
            <motion.div variants={staggerItem}>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">PROBLEM</h3>
              <p className="mt-2 text-ink">{project.problem}</p>
            </motion.div>
            <motion.div variants={staggerItem}>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">APPROACH</h3>
              <ul className="mt-2 space-y-2 text-ink">
                {project.approach.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={staggerItem}>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">
                {project.decision.title.toUpperCase()}
              </h3>
              <p className="mt-2 text-ink">{project.decision.body}</p>
            </motion.div>
            <motion.div variants={staggerItem}>
              <h3 className="font-mono text-xs tracking-widest text-ink-dim">SCOPE</h3>
              <ul className="mt-2 space-y-1 text-ink-dim">
                {project.scope.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </motion.div>
          </Stagger>

          <p className="mt-10 font-mono text-xs tracking-widest text-accent-text">{project.outcome}</p>
        </div>
      </Reveal>
    </section>
  );
}
