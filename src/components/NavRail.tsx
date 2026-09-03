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
    <nav
      aria-label="Section navigation"
      className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 font-mono text-xs tracking-widest md:flex"
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
