import { experience, education } from '../data/experience';
import { secondaryProjects } from '../data/projects';

export function Experience() {
  return (
    <section id="experience" className="bg-void px-6 py-section">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 02 — EXPERIENCE</p>

        <div className="mt-8 space-y-10">
          {experience.map((role) => (
            <article key={role.company} className="border-l border-white/10 pl-6">
              <p className="font-mono text-xs tracking-widest text-ink-dim">
                {role.start} – {role.end}
              </p>
              <h3 className="mt-1 font-display text-2xl text-ink">
                {role.role} · {role.company}
              </h3>
              <p className="text-sm text-ink-dim">{role.location}</p>
              <ul className="mt-4 space-y-2 text-ink">
                {role.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16">
          <p className="font-mono text-xs tracking-widest text-ink-dim">ALSO BUILT</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {secondaryProjects.map((project) => (
              <div key={project.id} className="rounded-md border border-white/10 p-5">
                <h4 className="font-display text-lg text-ink">{project.name}</h4>
                <p className="mt-2 text-sm text-ink-dim">{project.tagline}</p>
                <p className="mt-3 font-mono text-[10px] tracking-widest text-ink-dim">
                  {project.stack.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 font-mono text-xs tracking-widest text-ink-dim">
          {education.program}, {education.school} — {education.graduation}
        </p>
      </div>
    </section>
  );
}
