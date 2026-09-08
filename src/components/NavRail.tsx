import { motion } from 'framer-motion';
import { useActiveSection } from '../hooks/useActiveSection';
import { underlineLink } from '../styles/shared';

const SECTIONS = [
  { id: 'hero', label: '01 HOME' },
  { id: 'experience', label: '02 EXPERIENCE' },
  { id: 'projects', label: '03 PROJECTS' },
  { id: 'skills', label: '04 SKILLS' },
  { id: 'contact', label: '05 CONTACT' },
];

export function NavRail() {
  const activeId = useActiveSection(SECTIONS.map((section) => section.id));

  return (
    // Vertical rail, right edge, from lg up; collapses to a fixed bottom bar
    // below that instead of disappearing — narrow viewports still need a way to
    // jump sections without hand-scrolling past the whole page. The switch is at
    // lg, not md: the hero only clears a right gutter for the rail at lg, so at
    // md the floating column landed on top of the hero's own content.
    // Only opacity animates here (not y/x) — the desktop layout centers this
    // rail with a `-translate-y-1/2` class, and a motion-driven transform would
    // clobber that inline once framer-motion takes ownership of `transform`.
    <motion.nav
      aria-label="Section navigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-bg/90 px-4 py-3 font-mono text-[10px] tracking-widest backdrop-blur-sm lg:inset-x-auto lg:inset-y-1/2 lg:bottom-auto lg:right-6 lg:top-1/2 lg:flex-col lg:justify-start lg:gap-4 lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-0 lg:text-xs lg:backdrop-blur-none lg:-translate-y-1/2"
    >
      {SECTIONS.map((section) => {
        const isActive = activeId === section.id;

        return (
          <motion.a
            key={section.id}
            href={`#${section.id}`}
            aria-current={isActive ? 'true' : undefined}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`inline-flex items-center transition-colors ${underlineLink} ${
              isActive ? 'text-accent-text' : 'text-ink-dim hover:text-ink'
            }`}
          >
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="mr-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-text"
            />
            {section.label}
          </motion.a>
        );
      })}
    </motion.nav>
  );
}
