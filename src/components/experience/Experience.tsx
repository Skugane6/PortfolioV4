import { useEffect, useRef, useState } from 'react';
import { aircraft } from '../../content/aircraft';
import { roles } from '../../content/experience';
import { profile } from '../../content/profile';
import { sheetById } from '../../content/sheets';
import type { Role } from '../../content/types';
import { useReducedMotionPref } from '../../lib/motion';
import { drawingScale } from '../../lib/scale';
import { DRAWING } from '../../lib/stations';
import { useHydrated, useMedia } from '../../lib/useMedia';
import { EXTENT } from '../drawing/airframeGeometry';
import { SheetFrame } from '../shell/SheetFrame';
import { SpecTable } from './SpecTable';
import { SurveyNarrow } from './SurveyNarrow';
import { SurveyWide } from './SurveyWide';

const WIDE = '(min-width: 1024px) and (min-height: 700px)';

/**
 * Sheet 02, the side elevation. The prerendered HTML is the narrow, finished
 * sheet (readable with no script and no motion); once running it picks the
 * wide pinned survey or the narrow sticky one, animated unless the visitor
 * prefers reduced motion.
 */
export function Experience() {
  const role = roles[0];
  const hydrated = useHydrated();
  const reduced = useReducedMotionPref();
  const wide = useMedia(WIDE, false);
  const animated = hydrated && !reduced;
  const [hovered, setHovered] = useState<string | null>(null);
  const airframeRef = useRef<HTMLDivElement>(null);
  const scale = useDrawingScale(airframeRef, wide);

  const header = <RoleHeader role={role} />;
  const props = { role, animated, hovered, setHovered, header, airframeRef };

  return (
    <SheetFrame
      sheet={sheetById.experience}
      extraRows={[{ label: 'Scale', value: scale ? `1:${scale}` : 'NTS', data: true }]}
    >
      {hydrated && wide ? <SurveyWide {...props} /> : <SurveyNarrow {...props} />}
      <Notes />
    </SheetFrame>
  );
}

function RoleHeader({ role }: { role: Role }) {
  return (
    <div className="min-w-0">
      <h2 id="experience-title" className="w-cond text-title font-bold">
        {sheetById.experience.title}
      </h2>
      <div className="mt-4 flex items-center gap-4">
        {role.logo && (
          <img
            src={role.logo.src}
            alt=""
            width={role.logo.width}
            height={role.logo.height}
            className="h-8 w-auto shrink-0 [filter:brightness(0)_invert(1)]"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="min-w-0 border-l border-faded/60 pl-4">
          <p className="w-narrow text-heading font-semibold">{role.company}</p>
          <p className="mt-1 text-small text-faded">
            {role.role}, {role.location}.{' '}
            <span className="figures whitespace-nowrap text-blueprint">
              {role.start} – {role.end}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Drawing notes: the spec table, how stations are measured, and the education line. */
function Notes() {
  return (
    <div className="grid gap-10 border-t border-construction/60 px-4 py-10 sm:px-8 lg:grid-cols-12 lg:pl-16 lg:pr-12">
      <div className="lg:col-span-5">
        <SpecTable />
      </div>
      <div className="lg:col-span-7">
        <h3 className="lettering text-label text-faded">Notes</h3>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-small text-faded marker:font-mono marker:text-faded">
          <li id="spec-sources">
            Published figures:{' '}
            {aircraft.sources.map((s, i) => (
              <span key={s.href}>
                {i > 0 && '; '}
                <a className="link text-blueprint" href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </span>
            ))}
            .
          </li>
          <li>{aircraft.stationNote}</li>
          <li>
            Flight direction is to the left <span aria-hidden="true">←</span>. Drawn as a {aircraft.drawnAs}.
          </li>
          <li id="education" className="scroll-mt-24 text-blueprint">
            Education: {profile.education.program}, {profile.education.school}, {profile.education.location}. Graduated{' '}
            <span className="figures">{profile.education.graduated}</span>.
          </li>
        </ol>
      </div>
    </div>
  );
}

/** The live drawing scale, 1:N, from how wide the airframe is drawn right now. */
function useDrawingScale(ref: React.RefObject<HTMLDivElement>, dep: unknown) {
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(drawingScale(el.getBoundingClientRect().width * (EXTENT.right - EXTENT.left), DRAWING.lengthM));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, dep]);
  return scale;
}
