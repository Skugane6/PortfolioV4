import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { projects } from '../../content/projects';
import { sheetById } from '../../content/sheets';
import type { Project } from '../../content/types';
import { useReducedMotionPref } from '../../lib/motion';
import { useUi } from '../../lib/ui';
import { useHydrated } from '../../lib/useMedia';
import { SheetFrame } from '../shell/SheetFrame';
import { CaseStudyDialog } from './CaseStudyDialog';
import { DeviceFrames } from './DeviceFrames';
import { FigureSketch } from './FigureSketch';
import { useCaseStudyRoute } from './useCaseStudyRoute';

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

/**
 * Sheet 03, detail drawings. Every project is visible at once as a figure;
 * each opens its full detail sheet (how it's built, architecture, and for
 * three of them a working demo) in a dialog linked from the URL.
 */
export function Projects() {
  const ids = projects.map((p) => p.id);
  const { openId, open, close } = useCaseStudyRoute(ids);
  const hydrated = useHydrated();
  const reduced = useReducedMotionPref();
  const returnFocus = useRef<HTMLElement | null>(null);
  const openProject = projects.find((p) => p.id === openId) ?? null;

  const onOpen = (id: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    open(id);
  };
  const onClosed = (p: Project) => {
    const target = returnFocus.current?.isConnected
      ? returnFocus.current
      : document.querySelector<HTMLElement>(`#fig-${p.fig} [data-open]`);
    returnFocus.current = null;
    target?.focus({ preventScroll: false });
  };

  // The command palette asks for a sheet through the UI store.
  const request = useUi((s) => s.projectRequest);
  useEffect(() => {
    if (request) onOpen(request.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.seq]);

  const [feature, ...rest] = projects;

  return (
    <SheetFrame sheet={sheetById.projects}>
      <div className="px-4 pb-12 pt-10 sm:px-8 lg:pl-16 lg:pr-12 lg:pt-16">
        <h2 id="projects-title" className="w-cond text-title font-bold">
          {sheetById.projects.title}
        </h2>
        <p className="mt-3 max-w-[60ch] text-body text-faded">
          Four projects, one figure each. Open a figure for how it’s built; three of them have a working demo inside.
        </p>

        <div className="mt-10 space-y-6">
          <FeatureFigure project={feature} onOpen={onOpen} animated={hydrated && !reduced} />
          <div className="grid gap-6 lg:grid-cols-3">
            {rest.map((p) => (
              <FigureCard key={p.id} project={p} onOpen={onOpen} />
            ))}
          </div>
        </div>
      </div>
      <CaseStudyDialog project={openProject} onClose={close} onClosed={onClosed} />
    </SheetFrame>
  );
}

interface FigureProps {
  project: Project;
  onOpen: (id: string) => void;
}

/** The frame a figure shares with its detail sheet, so the sheet can grow out of it. */
function FigureFrame({ project }: { project: Project }) {
  return <m.div layoutId={`fig-frame-${project.id}`} aria-hidden="true" className="pointer-events-none absolute inset-0 border border-faded/60" />;
}

function FigureMeta({ project }: { project: Project }) {
  return (
    <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-label">
      <span className="lettering font-mono text-faded">Fig. {project.fig}</span>
      {project.live ? (
        <span className="flex items-center gap-2 text-blueprint">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-checker" />
          Live in production
        </span>
      ) : project.demo ? (
        <span className="text-faded">Demo inside</span>
      ) : null}
    </p>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Stack">
      {items.map((s) => (
        <li key={s} className="border border-faded/50 px-2 py-0.5 text-label text-faded">
          {s}
        </li>
      ))}
    </ul>
  );
}

function OpenButton({ project, onOpen, primary = false }: FigureProps & { primary?: boolean }) {
  return (
    <button
      type="button"
      data-open
      onClick={() => onOpen(project.id)}
      className={primary ? 'btn-primary' : 'btn-secondary'}
      // Starts with the visible text, so speech-input users can say what they see (WCAG 2.5.3).
      aria-label={`Open detail: ${project.name}`}
    >
      Open detail
    </button>
  );
}

function FeatureFigure({ project, onOpen, animated }: FigureProps & { animated: boolean }) {
  const titleId = `fig-${project.fig}-title`;
  return (
    <article id={`fig-${project.fig}`} aria-labelledby={titleId} className="ground relative scroll-mt-10 xl:grid xl:grid-cols-12">
      <FigureFrame project={project} />
      <div className="relative flex flex-col p-5 sm:p-8 xl:col-span-5">
        <FigureMeta project={project} />
        <h3 id={titleId} className="w-cond mt-4 text-title font-bold">
          {project.name}
        </h3>
        <p className="mt-4 max-w-[52ch] text-body text-blueprint">{project.tagline}</p>
        <Stack items={project.stack} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <OpenButton project={project} onOpen={onOpen} primary />
          {project.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="btn-secondary">
              {l.label}
              {NEW_TAB}
            </a>
          ))}
        </div>
      </div>
      <div className="relative flex items-center border-t border-faded/40 p-5 sm:p-8 xl:col-span-7 xl:border-l xl:border-t-0">
        {project.screens && (
          <div className="w-full">
            <DeviceFrames screens={project.screens} animated={animated} url="crafttraq.com" />
          </div>
        )}
      </div>
    </article>
  );
}

/** A secondary figure: sketch beside the text on tablets, above it in the three-up row. */
function FigureCard({ project, onOpen }: FigureProps) {
  const titleId = `fig-${project.fig}-title`;
  const split = project.demo ? 'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:flex' : '';
  return (
    <article id={`fig-${project.fig}`} aria-labelledby={titleId} className={`ground relative flex scroll-mt-10 flex-col ${split}`}>
      <FigureFrame project={project} />
      {project.demo && (
        <div className="relative flex items-center border-b border-faded/40 p-5 md:border-b-0 md:border-r lg:border-b lg:border-r-0">
          <div className="aspect-[14/9] w-full">
            <FigureSketch kind={project.demo} />
          </div>
        </div>
      )}
      <div className="relative flex flex-1 flex-col p-5">
        <FigureMeta project={project} />
        <h3 id={titleId} className="w-narrow mt-3 text-heading font-semibold">
          {project.name}
        </h3>
        <p className="mt-2 text-small text-faded">{project.tagline}</p>
        <Stack items={project.stack} />
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
          <OpenButton project={project} onOpen={onOpen} />
          {project.links.map((l) => (
            <a key={l.href} className="link text-small" href={l.href} target="_blank" rel="noreferrer">
              {l.label}
              {NEW_TAB}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
