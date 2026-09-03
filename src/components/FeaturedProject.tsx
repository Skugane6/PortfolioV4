import { featuredProject } from '../data/projects';
import { ScreenshotCallout } from './ScreenshotCallout';

export function FeaturedProject() {
  const project = featuredProject;

  return (
    <section id="work" className="bg-raised px-6 py-section">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs tracking-widest text-accent-text">§ 01 — FEATURED WORK</p>
        <h2 className="mt-4 font-display text-display-md text-ink">{project.name}</h2>
        <p className="mt-2 max-w-2xl text-ink-dim">{project.tagline}</p>

        <div className="relative mt-10 overflow-hidden rounded-md border border-white/10">
          <picture>
            <source srcSet={project.screenshot.webp} type="image/webp" />
            <img src={project.screenshot.src} alt={project.screenshot.alt} loading="lazy" className="w-full" />
          </picture>
          {project.callouts.map((callout) => (
            <ScreenshotCallout key={callout.label} {...callout} />
          ))}
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">PROBLEM</h3>
            <p className="mt-2 text-ink">{project.problem}</p>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">APPROACH</h3>
            <ul className="mt-2 space-y-2 text-ink">
              {project.approach.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">
              {project.decision.title.toUpperCase()}
            </h3>
            <p className="mt-2 text-ink">{project.decision.body}</p>
          </div>
          <div>
            <h3 className="font-mono text-xs tracking-widest text-ink-dim">SCOPE</h3>
            <ul className="mt-2 space-y-1 text-ink-dim">
              {project.scope.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 font-mono text-xs tracking-widest text-accent-text">{project.outcome}</p>
      </div>
    </section>
  );
}
