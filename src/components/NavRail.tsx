import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useActiveSection } from '../hooks/useActiveSection';
import { animateScrollTo, type ScrollAnimation } from '../utils/smoothScroll';
import { underlineLink } from '../styles/shared';

// Number and name are separate fields rather than one "01 HOME" string
// because the two layouts set them differently: the desktop rail runs them on
// one line as a drawing callout, while the mobile bar stacks the number over
// the name. Joined into one line they did fit, at exactly 360px of the 375px
// available, with zero space between five adjacent touch targets.
const SECTIONS = [
  { id: 'hero', index: '01', name: 'HOME' },
  { id: 'experience', index: '02', name: 'EXPERIENCE' },
  { id: 'projects', index: '03', name: 'PROJECTS' },
  { id: 'skills', index: '04', name: 'SKILLS' },
  { id: 'contact', index: '05', name: 'CONTACT' },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

export function NavRail() {
  const observedId = useActiveSection(SECTION_IDS);
  // While an animated jump is in flight the rail shows its destination rather
  // than whatever it is flying over, otherwise a hero -> contact trip strobes
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
    // below that instead of disappearing: narrow viewports still need a way to
    // jump sections without hand-scrolling past the whole page. The switch is at
    // lg, not md: the hero only clears a right gutter for the rail at lg, so at
    // md the floating column landed on top of the hero's own content.
    // Only opacity animates here (not y/x): the desktop layout centers this
    // rail with a `-translate-y-1/2` class, and a motion-driven transform would
    // clobber that inline once framer-motion takes ownership of `transform`.
    <motion.nav
      aria-label="Section navigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      // Mobile: pb-[max(env(safe-area-inset-bottom),0.5rem)] keeps the bar
      // clear of the iOS home indicator, which otherwise sits on top of the
      // labels. Desktop: the rail floats over the aircraft cutaway and the
      // project panel, so it carries its own hairline-bordered plate from lg
      // up rather than sitting naked on whatever happens to scroll under it.
      // "03 PROJECTS" was previously landing on the fuselage dashed rule.
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-bg/90 px-1 pt-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] font-mono text-[10px] tracking-widest backdrop-blur-sm lg:inset-x-auto lg:inset-y-1/2 lg:bottom-auto lg:right-6 lg:top-1/2 lg:flex-col lg:justify-start lg:gap-1 lg:rounded-xl lg:border lg:border-[rgba(90,130,200,.14)] lg:bg-bg/55 lg:px-3 lg:py-3.5 lg:pb-3.5 lg:text-xs lg:backdrop-blur-md lg:-translate-y-1/2"
    >
      {SECTIONS.map((section) => {
        const isActive = activeId === section.id;

        return (
          <motion.a
            key={section.id}
            href={`#${section.id}`}
            onClick={(event) => handleClick(event, section.id)}
            aria-label={`${section.index} ${section.name}`}
            aria-current={isActive ? 'true' : undefined}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            // min-h-[44px] + px-2 on mobile: these were 30px tall, under the
            // 44x44 minimum, and five of them sat shoulder to shoulder across a
            // 375px bar with nothing between the hit areas. The padding is
            // dropped back at lg where the rail is a pointer target, not a
            // thumb one, but the vertical padding stays so the plate's rows
            // keep an even rhythm.
            // Mobile: flex-1 splits the bar into five equal 44px-tall columns
            // with the number stacked over the name, which is what buys the
            // touch height and the breathing room between hit areas. From lg
            // the item collapses back to the single-line drawing callout the
            // vertical rail wants.
            className={`relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[9px] tracking-[.12em] transition-colors lg:min-h-0 lg:flex-none lg:flex-row lg:gap-0 lg:px-1.5 lg:py-1.5 lg:text-xs lg:tracking-widest ${underlineLink} ${
              isActive ? 'text-accent-text' : 'text-ink-dim hover:text-ink'
            }`}
          >
            {/* One shared dot with a layoutId, not five that fade in and out:
                framer-motion then animates the single marker *between* items, so
                the rail reads as one indicator travelling down the list. On the
                mobile bar it sits under the label as an underline dot instead
                of beside it, since there is no horizontal room for it there. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center lg:relative lg:inset-auto lg:mr-1.5 lg:block lg:h-1 lg:w-1 lg:shrink-0"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-rail-marker"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="block h-1 w-1 rounded-full bg-accent-text lg:absolute lg:inset-0 lg:h-auto lg:w-auto"
                />
              )}
            </span>
            {/* The two layouts break the label in different places, so the
                accessible name comes from aria-label and both visible halves
                are aria-hidden, otherwise the stacked mobile version would
                announce as "01" then "01 HOME". */}
            <span aria-hidden="true" className="lg:hidden">
              {section.index}
            </span>
            <span aria-hidden="true" className="hidden whitespace-nowrap lg:inline">
              {section.index}&nbsp;{section.name}
            </span>
            <span aria-hidden="true" className="whitespace-nowrap lg:hidden">
              {section.name}
            </span>
          </motion.a>
        );
      })}
    </motion.nav>
  );
}
