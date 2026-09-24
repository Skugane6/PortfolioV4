import buildInfo from 'virtual:build-info';
import portrait from '../../assets/hero.jpg';
import { profile } from '../../content/profile';
import { aircraft } from '../../content/aircraft';
import { pad2, sheetById, sheets } from '../../content/sheets';
import { Airframe } from '../drawing/Airframe';
import { DetailBubble } from '../drawing/DetailBubble';
import { Dimension } from '../drawing/Dimension';
import { EXTENT } from '../drawing/airframeGeometry';
import { SheetFrame } from '../shell/SheetFrame';
import { TitleBlock, type TitleBlockRow } from '../shell/TitleBlock';
import { LocalTime } from './LocalTime';
import { ProofRefs } from './ProofRefs';

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

/**
 * Sheet 01, the cover sheet. Its job: who, what, the proof and how to reach
 * him, in the first screen. The name is the drawing title and the LCP
 * element; nothing on this sheet animates in (DESIGN.md §4.5, principle 1).
 */
export function Cover() {
  // Decimal kilobytes, as file managers report them.
  const kb = Math.round(profile.resume.bytes / 1000);

  return (
    <SheetFrame sheet={sheetById.cover} titleBlock={<CoverTitleBlock />} className="flex min-h-[100svh] flex-col">
      <div className="relative flex-1 px-4 pb-10 pt-10 sm:px-8 sm:pt-12 lg:pb-12 lg:pl-16 lg:pr-12 lg:pt-16">
        <h1 id="cover-title" className="w-cond text-display font-bold tracking-[-0.012em]">
          {profile.name}
        </h1>

        <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <p className="max-w-[44ch] text-lead text-blueprint">
              {profile.positioning.lead} {profile.positioning.specifics}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#experience" className="btn-primary">
                See the work
              </a>
              <a href={profile.resume.href} download className="btn-secondary">
                Résumé <span className="font-normal text-faded">(PDF, {kb} KB)</span>
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-small">
              <li>
                <a className="link" href={`mailto:${profile.email}`}>
                  Email
                </a>
              </li>
              <li>
                <a className="link" href={profile.links.github.href} target="_blank" rel="noreferrer">
                  GitHub{NEW_TAB}
                </a>
              </li>
              <li>
                <a className="link" href={profile.links.linkedin.href} target="_blank" rel="noreferrer">
                  LinkedIn{NEW_TAB}
                </a>
              </li>
            </ul>
          </div>

          <KeyDrawing />
        </div>

        <div className="mt-10 lg:mt-12">
          <h2 className="sr-only">Proof</h2>
          <ProofRefs items={profile.proof} firstLetter={1} />
        </div>
      </div>
    </SheetFrame>
  );
}

/** The cover's title block: who drew the set, his status, where and when. */
function CoverTitleBlock() {
  const { availability, location, datum } = profile;
  const holdFields = [availability.seeking ? null : 'role type', availability.from ? null : 'start date'].filter(Boolean);
  const rows: TitleBlockRow[] = [
    {
      label: 'Drawn',
      span: 2,
      value: (
        <span className="flex items-center gap-3">
          <img
            src={portrait}
            alt={`Portrait of ${profile.name}`}
            width={40}
            height={40}
            className="h-10 w-10 border border-faded/60 object-cover"
          />
          <span>{profile.drafter}</span>
        </span>
      ),
    },
    {
      label: 'Status',
      span: 2,
      value: (
        <span>
          {availability.status}
          {availability.seeking ? `: ${availability.seeking}` : ''}
          {availability.from ? `, from ${availability.from}` : ''}
          {holdFields.length > 0 && (
            <span className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="hold">Hold</span>
              <span className="text-small text-redline">{holdFields.join(', ')} to be confirmed</span>
            </span>
          )}
        </span>
      ),
    },
    { label: 'Location', value: location.summary },
    {
      label: 'Local time',
      value: (
        <span className="flex items-baseline gap-2">
          {location.city} <LocalTime timeZone={location.timeZone} />
        </span>
      ),
    },
    {
      label: 'Datum',
      span: 2,
      value: (
        <span>
          {datum.code} <span className="text-faded">{datum.name}</span>
          <span className="figures block">
            {datum.lat} {datum.lon}
          </span>
        </span>
      ),
    },
    { label: 'Sheet', value: `${pad2(1)} of ${pad2(sheets.length)}`, data: true },
    { label: 'Rev', value: buildInfo.hash, data: true },
    { label: 'Date', value: buildInfo.date, data: true },
    { label: 'Scale', value: 'NTS', data: true },
  ];
  return (
    <div className="relative px-4 pb-6 sm:px-8 lg:pl-16 lg:pr-12">
      <TitleBlock label="Cover sheet title block" rows={rows} columns={6} />
    </div>
  );
}

/**
 * The key drawing: the airframe small, with a detail bubble saying it is
 * drawn in full on sheet 02. The whole figure is the link there.
 */
function KeyDrawing() {
  return (
    <a
      href="#experience"
      className="group relative block self-start lg:col-span-6"
      aria-label={`Detail A, sheet 02: side elevation of the ${aircraft.family}, where the experience is drawn`}
    >
      <figure className="ground border border-faded/50 p-4 transition-colors duration-quick group-hover:border-blueprint sm:p-6">
        <div className="relative pb-10">
          <Airframe detail="key" title={`Side elevation, ${aircraft.family}`} decorative />
          <Dimension label="Overall" value={aircraft.overallLength} from={EXTENT.left} to={EXTENT.right} className="bottom-1" />
        </div>
        <figcaption className="mt-4 flex items-baseline justify-between gap-4 text-label text-faded">
          <span>
            <span className="lettering">Fig. A</span> Side elevation, {aircraft.family}
          </span>
          <span className="lettering font-mono">NTS</span>
        </figcaption>
      </figure>
      <DetailBubble
        id="A"
        sheet={pad2(2)}
        className="ground absolute -right-3 -top-4 text-faded transition-colors duration-quick group-hover:text-redline sm:-right-5 sm:-top-5"
      />
    </a>
  );
}
