import { Suspense, lazy, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { DemoKind, Project } from '../../content/types';
import { dur, spring } from '../../lib/motion';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { DeviceFrames, projectHost } from './DeviceFrames';

// Each demo is its own chunk, fetched only when its detail sheet opens.
const DEMOS: Partial<Record<DemoKind, LazyExoticComponent<ComponentType>>> = {
  risk: lazy(() => import('../demos/RiskDemo')),
  text: lazy(() => import('../demos/TextDemo')),
};

const DEMO_TITLES: Record<DemoKind, string> = {
  risk: 'Try it: move the portfolio along the frontier',
  text: 'Try it: send a sentence through the pipeline',
};

interface CaseStudyDialogProps {
  project: Project | null;
  onClose: () => void;
  /** Called after the close animation, to put focus back where it came from. */
  onClosed: (project: Project) => void;
}

/**
 * A project's detail sheet, in a modal dialog. The native <dialog> provides
 * the focus trap, Escape and the inert page behind it; Motion grows the
 * sheet's frame out of the figure it was opened from (shared layoutId) and
 * back into it on close, with the contents fading in once the frame is up.
 */
export function CaseStudyDialog({ project, onClose, onClosed }: CaseStudyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<Project | null>(null);
  const current = useRef<Project | null>(null);

  useEffect(() => {
    current.current = project;
    const dialog = dialogRef.current;
    if (!dialog || !project) return;
    setShown(project);
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('modal-open');
  }, [project]);

  const finishClose = () => {
    // AnimatePresence reports exit-complete whenever an old sheet has left,
    // including when another project replaced it: only close when none is open.
    if (current.current) return;
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    document.documentElement.classList.remove('modal-open');
    if (shown) onClosed(shown);
    setShown(null);
  };

  const Demo = project?.demo ? DEMOS[project.demo] : undefined;
  const headingId = project ? `case-${project.id}-title` : undefined;

  return (
    // Clicking the backdrop closes the sheet, a pointer convenience only:
    // keyboard users have Escape (the dialog's native cancel) and the Close
    // button, so the click handler needs no key equivalent here.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 h-[100svh] max-h-none w-full max-w-none overflow-visible bg-transparent p-0 text-blueprint backdrop:bg-cyanotype/85 sm:m-auto sm:h-fit sm:max-h-[calc(100svh-32px)] sm:w-[min(1120px,calc(100vw-32px))]"
    >
      <AnimatePresence onExitComplete={finishClose}>
        {project && (
          <div key={project.id} className="relative h-full">
            <m.div
              layoutId={`fig-frame-${project.id}`}
              transition={spring.ui}
              className="pointer-events-none absolute inset-0 z-20 border-2 border-blueprint"
              aria-hidden="true"
            />
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.14, duration: dur.base } }}
              exit={{ opacity: 0, transition: { duration: dur.quick } }}
              className="ground relative h-full overflow-y-auto sm:max-h-[calc(100svh-32px)]"
            >
              <header className="sticky top-0 z-10 flex items-stretch border-b border-faded/60 bg-cyanotype">
                <p className="lettering flex items-center border-r border-faded/60 px-4 font-mono text-label text-faded sm:px-6">
                  Fig. {project.fig}
                </p>
                <div className="min-w-0 flex-1 px-4 py-3 sm:px-6">
                  <h2 id={headingId} className="w-cond truncate text-title font-bold">
                    {project.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-w-[88px] items-center justify-center gap-2 border-l border-faded/60 px-4 text-small text-blueprint hover:text-redline"
                >
                  <span aria-hidden="true" className="font-mono">
                    ×
                  </span>
                  Close
                </button>
              </header>

              <div className="grid gap-10 px-4 py-8 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-10 lg:py-10">
                <div className="space-y-8 lg:col-span-7">
                  <Section title="What it does">
                    <p className="max-w-measure text-body">{project.caseStudy.does}</p>
                  </Section>
                  <Section title="How it’s built">
                    <ul className="max-w-measure space-y-3">
                      {project.caseStudy.built.map((line) => (
                        <li key={line} className="border-l border-faded/60 pl-4 text-body">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </Section>
                  {project.caseStudy.standing && (
                    <Section title="Where it stands">
                      <p className="text-body">{project.caseStudy.standing}</p>
                    </Section>
                  )}
                </div>

                <aside className="space-y-8 lg:col-span-5">
                  <Section title="Stack">
                    <ul className="flex flex-wrap gap-2">
                      {project.stack.map((s) => (
                        <li key={s} className="border border-faded/60 px-2.5 py-1 text-small text-blueprint">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Section>
                  {project.links.length > 0 && (
                    <Section title="Links">
                      <ul className="space-y-2 text-body">
                        {project.links.map((l) => (
                          <li key={l.href}>
                            <a className="link" href={l.href} target="_blank" rel="noreferrer">
                              {l.label}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                  <p className="text-label text-faded">Source: {project.caseStudy.source}.</p>
                </aside>

                <div className="lg:col-span-12">
                  <Section title="Architecture">
                    <ArchitectureDiagram architecture={project.caseStudy.architecture} />
                  </Section>
                </div>

                {project.screens && (
                  <div className="lg:col-span-12">
                    <Section title="Screens">
                      <DeviceFrames screens={project.screens} animated={false} eager url={projectHost(project)} />
                    </Section>
                  </div>
                )}

                {project.demo && Demo && (
                  <div className="border-t border-faded/60 pt-8 lg:col-span-12">
                    <Section title={DEMO_TITLES[project.demo]}>
                      <Suspense fallback={<p className="text-small text-faded">Loading the demo…</p>}>
                        <Demo />
                      </Suspense>
                    </Section>
                  </div>
                )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="w-narrow mb-3 text-heading font-semibold">{title}</h3>
      {children}
    </section>
  );
}
