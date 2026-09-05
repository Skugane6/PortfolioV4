import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { featuredProject, secondaryProjects } from '../data/projects';
import { Reveal } from './Reveal';
import { cardSurface, chipStamped } from '../styles/shared';
import type { FeaturedCaseStudy, ProjectEntry } from '../data/types';

type Slide = FeaturedCaseStudy | ProjectEntry;

const slides: Slide[] = [featuredProject, ...secondaryProjects];

// Matches the rail's `gap-6` (24px) so the translateX offset lands the active
// slide exactly in the viewport instead of drifting right by the accumulated gap.
const RAIL_GAP = 24;

function isFeatured(slide: Slide): slide is FeaturedCaseStudy {
  return slide.id === featuredProject.id;
}

export function Projects() {
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const reduceMotion = useReducedMotion();

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(slides.length - 1, next)));
  };

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setSlideWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollLeft = 0;
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < window.innerHeight * 0.35 || rect.top > window.innerHeight * 0.65) return;
      e.preventDefault();
      goTo(index + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) goTo(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section id="projects" ref={sectionRef} className="bg-surface px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs tracking-widest text-accent-text">§ 02 · PROJECTS</p>
              <h2 className="mt-3 font-display text-display-md text-ink">Four builds, one flight line.</h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest text-ink-dim">
              <span aria-live="polite">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                aria-label="Previous project"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className="h-8 w-9 rounded border border-border text-ink-dim transition-colors hover:border-accent-text hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next project"
                disabled={index === slides.length - 1}
                onClick={() => goTo(index + 1)}
                className="h-8 w-9 rounded border border-border text-ink-dim transition-colors hover:border-accent-text hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="mt-10 overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div
              className="flex items-start gap-6"
              style={{
                transform: `translateX(-${index * (slideWidth + RAIL_GAP)}px)`,
                transition: reduceMotion ? 'none' : 'transform 0.6s cubic-bezier(.22,.61,.36,1)',
              }}
            >
              {slides.map((slide, i) => (
                <article
                  key={slide.id}
                  style={{ flex: slideWidth ? `0 0 ${slideWidth}px` : '0 0 100%' }}
                  className={`${cardSurface} p-6 transition-opacity duration-300 ${
                    i === index ? 'opacity-100' : 'opacity-30'
                  }`}
                  aria-hidden={i !== index ? true : undefined}
                  {...(i !== index ? ({ inert: '' } as unknown as Record<string, unknown>) : {})}
                >
                  {isFeatured(slide) ? (
                    <>
                      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 font-mono text-[10px] tracking-widest text-ink-dim">
                        <span>01 · FEATURED BUILD</span>
                        <span className={chipStamped}>Live</span>
                      </div>
                      <h3 className="mt-5 font-display text-3xl text-ink">{slide.name}</h3>
                      <p className="mt-1 text-sm text-ink-dim">{slide.tagline}</p>
                      <picture>
                        <source srcSet={slide.screenshot.webp} type="image/webp" />
                        <img
                          src={slide.screenshot.src}
                          alt={slide.screenshot.alt}
                          loading="lazy"
                          className="mt-6 w-full rounded-lg border border-border"
                        />
                      </picture>
                      <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">PROBLEM</h4>
                          <p className="mt-2 text-sm text-ink">{slide.problem}</p>
                        </div>
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">APPROACH</h4>
                          <ul className="mt-2 space-y-2 text-sm text-ink">
                            {slide.approach.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">
                            {slide.decision.title.toUpperCase()}
                          </h4>
                          <p className="mt-2 text-sm text-ink">{slide.decision.body}</p>
                        </div>
                        <div>
                          <h4 className="font-mono text-[10px] tracking-widest text-ink-dim">SCOPE</h4>
                          <ul className="mt-2 space-y-1 text-sm text-ink-dim">
                            {slide.scope.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="mt-6 font-mono text-xs tracking-widest text-accent-text">{slide.outcome}</p>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-border pb-3 font-mono text-[10px] tracking-widest text-ink-dim">
                        {String(i + 1).padStart(2, '0')} · ALSO BUILT
                      </div>
                      <h3 className="mt-5 font-display text-2xl text-ink">{slide.name}</h3>
                      <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-ink-dim">{slide.tagline}</p>
                      {slide.image && (
                        <img
                          src={slide.image}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="mt-6 aspect-[21/9] w-full rounded-lg border border-border object-cover"
                        />
                      )}
                      <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10.5px] tracking-wide text-accent-text">
                        {slide.stack.map((tech) => (
                          <span key={tech} className="rounded border border-border px-2.5 py-1">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {slide.href && (
                        <a
                          href={slide.href}
                          target="_blank"
                          rel="noreferrer"
                          tabIndex={i !== index ? -1 : undefined}
                          className="mt-6 inline-block font-mono text-xs tracking-widest text-accent-text"
                        >
                          View on GitHub ↗
                        </a>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5 font-mono text-[10.5px] tracking-wide">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                className={`rounded border px-3 py-1.5 transition-colors ${
                  i === index ? 'border-accent-text text-ink' : 'border-border text-ink-dim'
                }`}
              >
                {String(i + 1).padStart(2, '0')} {slide.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
