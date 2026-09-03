import { skillGroups } from '../data/skills';

export function Skills() {
  return (
    <section id="skills" className="bg-raised px-6 py-section">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 03 — SKILLS</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-display text-xl text-ink">{group.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-sm border border-white/10 px-2 py-1 font-mono text-xs text-ink-dim"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
