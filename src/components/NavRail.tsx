import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useActiveSection } from '../hooks/useActiveSection';
import { animateScrollTo, type ScrollAnimation } from '../utils/smoothScroll';
import { underlineLink } from '../styles/shared';

const SECTIONS = [
  { id: 'hero', label: '01 HOME' },
  { id: 'experience', label: '02 EXPERIENCE' },
  { id: 'projects', label: '03 PROJECTS' },
  { id: 'skills', label: '04 SKILLS' },
  { id: 'contact', label: '05 CONTACT' },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

export function NavRail() {
  const observedId = useActiveSection(SECTION_IDS);
  // While an animated jump is in flight the rail shows its destination rather
  // than whatever it is flying over — otherwise a hero -> contact trip strobes
  // through all five labels on the way down.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const animationRef = useRef<ScrollAnimation | null>(null);
  const activeId = pendingId ?? observedId;

  useEffect(() => () => animationRef.current?.cancel(), []);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    // Leave modified clicks (new tab/window) and non-primary buttons alone.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    const target = document.getElementById(id);
    if (!target) return; // no element to reach: let the browser do its default thing

    event.preventDefault();
    animationRef.current?.cancel();

    setPendingId(id);
    // replaceState, not the default hash jump: it keeps the URL shareable
    // without the browser teleporting the viewport out from under the tween,
    // and without stacking a history entry per rail click.
    history.replaceState(null, '', `#${id}`);

    const animation = animateScrollTo(target.getBoundingClientRect().top + window.scrollY);
    animationRef.current = animation;
    animation.finished.then(() => {
      if (animationRef.current === animation) {
        animationRef.current = null;
        setPendingId(null); // hand the highlight back to the observer
      }
    });
  };

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
            onClick={(event) => handleClick(event, section.id)}
            aria-current={isActive ? 'true' : undefined}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative inline-flex items-center transition-colors ${underlineLink} ${
              isActive ? 'text-accent-text' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {/* One shared dot with a layoutId, not five that fade in and out:
                framer-motion then animates the single marker *between* items, so
                the rail reads as one indicator travelling down the list. */}
            <span aria-hidden="true" className="relative mr-1.5 inline-block h-1 w-1 shrink-0">
              {isActive && (
                <motion.span
                  layoutId="nav-rail-marker"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-accent-text"
                />
              )}
            </span>
            {section.label}
          </motion.a>
        );
      })}
    </motion.nav>
  );
}
