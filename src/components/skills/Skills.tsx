import { useState } from 'react';
import { skillGroupOrder, skillGroups, skills } from '../../content/skills';
import { sheetById } from '../../content/sheets';
import type { SkillGroup } from '../../content/types';
import { useReducedMotionPref } from '../../lib/motion';
import { useHydrated, useMedia } from '../../lib/useMedia';
import { SheetFrame } from '../shell/SheetFrame';
import { BomTable } from './BomTable';
import { ExplodedView } from './ExplodedView';
import { PartDetail } from './PartDetail';
import { parts, partsByGroup } from './partsIndex';

/**
 * Sheet 04: the stack as an assembly drawing and its bill of materials. The
 * groups filter the table; selecting a part (click, tap or Enter) shows where
 * it was used, linked to the exact experience callout, project or résumé line.
 */
export function Skills() {
  const [group, setGroup] = useState<SkillGroup | 'all'>('all');
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const hydrated = useHydrated();
  const reduced = useReducedMotionPref();
  const wide = useMedia('(min-width: 1024px)', true);
  const part = parts.find((p) => p.item === selected) ?? null;

  const chooseGroup = (g: SkillGroup | 'all') => {
    setGroup((current) => (current === g ? 'all' : g));
    if (part && g !== 'all' && part.skill.group !== g) setSelected(0);
  };

  const detail = <PartDetail part={part} onSelect={setSelected} />;

  return (
    <SheetFrame sheet={sheetById.skills} extraRows={[{ label: 'Parts', value: String(skills.length), data: true }]}>
      <div className="px-4 pb-12 pt-10 sm:px-8 lg:pl-16 lg:pr-12 lg:pt-16">
        <h2 id="skills-title" className="w-cond text-title font-bold">
          {sheetById.skills.title}
        </h2>
        <p className="mt-3 max-w-[62ch] text-body text-faded">
          The stack as an assembly: what the product is built with, what it plugs into, what it computes, and what keeps it
          honest. QTY counts the places each part is used, from the experience, the projects and the résumé.
        </p>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter parts by group">
          <FilterButton active={group === 'all'} onClick={() => setGroup('all')} label="All parts" count={skills.length} />
          {skillGroupOrder.map((g) => (
            <FilterButton
              key={g}
              active={group === g}
              onClick={() => chooseGroup(g)}
              label={skillGroups[g].label}
              count={partsByGroup[g].length}
              caption={skillGroups[g].caption}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <ExplodedView group={group} selected={selected} hovered={hovered} onGroup={chooseGroup} animated={hydrated && !reduced} />
            {/* The detail panel sticks while the table scrolls past it. */}
            {hydrated && wide && <div className="mt-8 lg:sticky lg:top-8">{detail}</div>}
          </div>
          <div className="lg:col-span-7">
            {!(hydrated && wide) && !part && <div className="mb-6">{detail}</div>}
            <BomTable
              group={group}
              selected={selected}
              onSelect={setSelected}
              onHover={setHovered}
              inlineDetail={!(hydrated && wide) ? <div className="border-y border-faded/40 p-3">{detail}</div> : undefined}
            />
          </div>
        </div>
      </div>
    </SheetFrame>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  caption,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  caption?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={caption}
      className={`flex min-h-[44px] items-center gap-2 border px-3 text-small transition-colors duration-quick ${
        active ? 'border-2 border-redline px-[11px] text-blueprint' : 'border-faded/60 text-faded hover:border-blueprint hover:text-blueprint'
      }`}
    >
      {label}
      <span className="figures text-blueprint">{count}</span>
    </button>
  );
}
