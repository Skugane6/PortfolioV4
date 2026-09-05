import { motion } from 'framer-motion';
import { useActiveSection } from '../hooks/useActiveSection';
import { underlineLink } from '../styles/shared';

const SECTIONS = [
  { id: 'work', label: '01 WORK' },
  { id: 'experience', label: '02 EXPERIENCE' },
  { id: 'skills', label: '03 SKILLS' },
  { id: 'contact', label: '04 CONTACT' },
];

export function NavRail() {
  const activeId = useActiveSection(SECTIONS.map((section) => section.id));

  return (
    // Vertical rail, right edge, on desktop; collapses to a fixed bottom bar on
    // mobile instead of disappearing — narrow viewports still need a way to jump
    // sections without hand-scrolling past the whole page.
    // Only opacity animates here (not y/x) — the desktop layout centers this
    // rail with a `-translate-y-1/2` class, and a motion-driven transform would
    // clobber that inline once framer-motion takes ownership of `transform`.
    <motion.nav
      aria-label="Section navigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-bg/90 px-4 py-3 font-mono text-[10px] tracking-widest backdrop-blur-sm md:inset-x-auto md:inset-y-1/2 md:bottom-auto md:right-6 md:top-1/2 md:flex-col md:justify-start md:gap-4 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:text-xs md:backdrop-blur-none md:-translate-y-1/2"
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
