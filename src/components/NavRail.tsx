import { useActiveSection } from '../hooks/useActiveSection';

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
    <nav
      aria-label="Section navigation"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/10 bg-void/90 px-4 py-3 font-mono text-[10px] tracking-widest backdrop-blur-sm md:inset-x-auto md:inset-y-1/2 md:bottom-auto md:right-6 md:top-1/2 md:flex-col md:justify-start md:gap-4 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:text-xs md:backdrop-blur-none md:-translate-y-1/2"
    >
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={activeId === section.id ? 'true' : undefined}
          className={
            activeId === section.id
              ? 'text-accent-text transition-colors'
              : 'text-ink-dim transition-colors hover:text-ink'
          }
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
