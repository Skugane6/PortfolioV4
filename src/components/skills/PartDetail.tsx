import { useSkillMarks } from './useSkillMarks';
import { skillGroups } from '../../content/skills';
import { itemLabel, mostUsed, type Part } from './partsIndex';

interface PartDetailProps {
  part: Part | null;
  onSelect: (item: number) => void;
}

/**
 * Detail A: the selected part, and where it was actually used. With nothing
 * selected it shows the five most-used parts rather than an empty state.
 */
export function PartDetail({ part, onSelect }: PartDetailProps) {
  return (
    <section aria-labelledby="part-detail-title" aria-live="polite" className="ground border border-faded/60">
      <header className="flex items-baseline justify-between gap-4 border-b border-faded/40 px-4 py-3">
        <h3 id="part-detail-title" className="w-narrow text-small font-semibold text-blueprint">
          {part ? `Detail A: ${part.skill.name}` : 'Detail A: most used'}
        </h3>
        {part && (
          <button type="button" onClick={() => onSelect(0)} className="link text-label text-faded">
            Clear
          </button>
        )}
      </header>
      <div className="p-4">{part ? <Selected part={part} /> : <MostUsed onSelect={onSelect} />}</div>
    </section>
  );
}

function Selected({ part }: { part: Part }) {
  const mark = useSkillMarks()?.[part.skill.icon];
  return (
    <div>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center border border-faded/60"
          style={{ color: mark?.hex }}
        >
          {mark && <svg viewBox={mark.viewBox} className="h-8 w-8" dangerouslySetInnerHTML={{ __html: mark.body }} />}
        </span>
        <div className="min-w-0">
          <p className="lettering font-mono text-label text-faded">Item {itemLabel(part.item)}</p>
          <p className="w-narrow text-heading font-semibold text-blueprint">{part.skill.name}</p>
          <p className="text-small text-faded">
            {skillGroups[part.skill.group].label}
            {part.skill.note ? `: ${part.skill.note}` : ''}
          </p>
        </div>
      </div>

      <h4 className="lettering mt-6 text-label text-faded">
        Used in <span className="figures">{part.qty === 0 ? '' : `(${part.qty})`}</span>
      </h4>
      {part.qty === 0 ? (
        <p className="mt-2 text-small text-faded">
          {part.usage.listedOnResume
            ? 'Listed in the résumé’s technical skills. Not used in anything shown on this site.'
            : 'Not used in anything shown on this site.'}
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {part.usage.refs.map((ref) => (
            <li key={`${ref.kind}-${ref.id}`} className="border-l border-faded/60 pl-3 text-small">
              <a className="link text-blueprint" href={ref.href} {...(ref.kind === 'resume' ? { target: '_blank', rel: 'noreferrer' } : {})}>
                {ref.label}
                {ref.kind === 'resume' && <span className="sr-only"> (opens the résumé PDF in a new tab)</span>}
              </a>
              <span className="ml-2 text-label text-faded">
                {ref.kind === 'callout' ? 'Experience, sheet 02' : ref.kind === 'project' ? 'Project, sheet 03' : 'Résumé'}
              </span>
              {ref.quote && <q className="mt-1 block text-label text-faded">{ref.quote}</q>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MostUsed({ onSelect }: { onSelect: (item: number) => void }) {
  const max = Math.max(...mostUsed.map((p) => p.qty), 1);
  return (
    <div>
      <p className="text-small text-faded">The parts used in the most places across experience, projects and the résumé. Select any part for where.</p>
      <ol className="mt-4 space-y-2">
        {mostUsed.map((p) => (
          <li key={p.item}>
            <button type="button" onClick={() => onSelect(p.item)} className="group grid w-full grid-cols-[3ch_minmax(0,1fr)_auto] items-center gap-3 py-1 text-left">
              <span className="font-mono text-label text-faded">{itemLabel(p.item)}</span>
              <span className="min-w-0">
                <span className="block text-small text-blueprint group-hover:underline">{p.skill.name}</span>
                <span aria-hidden="true" className="mt-1 block h-[2px] bg-construction/40">
                  <span className="block h-full bg-blueprint" style={{ width: `${(p.qty / max) * 100}%` }} />
                </span>
              </span>
              <span className="figures text-small text-blueprint">{p.qty}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
