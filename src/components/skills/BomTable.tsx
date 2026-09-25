import { Fragment, useState, type ReactNode } from 'react';
import { useSkillMarks } from './useSkillMarks';
import { skillGroups } from '../../content/skills';
import type { SkillGroup } from '../../content/types';
import { itemLabel, parts } from './partsIndex';

interface BomTableProps {
  group: SkillGroup | 'all';
  selected: number;
  onSelect: (item: number) => void;
  onHover: (item: number) => void;
  /** Rendered as an expanded row under the selected part (narrow screens). */
  inlineDetail?: ReactNode;
}

/**
 * The bill of materials: item, part, note, quantity. QTY is the number of
 * places the part is used (derived; see lib/usage). Each part name is a
 * toggle button, so click, tap and Enter all select it.
 */
export function BomTable({ group, selected, onSelect, onHover, inlineDetail }: BomTableProps) {
  const [byQty, setByQty] = useState(false);
  const marks = useSkillMarks();
  const rows = parts
    .filter((p) => group === 'all' || p.skill.group === group)
    .sort((a, b) => (byQty ? b.qty - a.qty || a.item - b.item : a.item - b.item));

  return (
    <table className="ground w-full border-collapse text-small">
      <caption className="sr-only">
        Bill of materials{group === 'all' ? '' : `, ${skillGroups[group].label}`}: {rows.length} parts. Select a part to see where it was used.
      </caption>
      <thead>
        <tr className="border-b-2 border-faded/70 text-left">
          <th scope="col" className="lettering w-[4.5rem] py-2 pl-3 text-label font-normal text-faded">
            Item
          </th>
          <th scope="col" className="lettering py-2 text-label font-medium text-faded">
            Part
          </th>
          <th scope="col" className="lettering hidden py-2 text-label font-medium text-faded sm:table-cell">
            Note
          </th>
          <th scope="col" className="w-[5.5rem] py-2 pr-3 text-right" aria-sort={byQty ? 'descending' : 'none'}>
            <button type="button" onClick={() => setByQty((v) => !v)} className="lettering text-label font-medium text-faded hover:text-blueprint">
              Qty <span aria-hidden="true">{byQty ? '▾' : '↕'}</span>
              <span className="sr-only">{byQty ? ', sorted most used first; select to sort by item' : ', select to sort by most used'}</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const isSelected = p.item === selected;
          const mark = marks?.[p.skill.icon];
          return (
            <Fragment key={p.item}>
              <tr
                className={`border-b border-faded/25 transition-colors duration-quick ${isSelected ? 'bg-blueprint/[0.06]' : ''}`}
                onPointerEnter={() => onHover(p.item)}
                onPointerLeave={() => onHover(0)}
              >
                <td className={`py-1 pl-3 font-mono text-label ${isSelected ? 'text-redline' : 'text-faded'}`}>{itemLabel(p.item)}</td>
                <td className="py-1">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(isSelected ? 0 : p.item)}
                    onFocus={() => onHover(p.item)}
                    onBlur={() => onHover(0)}
                    className="flex min-h-[40px] w-full items-center gap-3 text-left"
                  >
                    <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center" style={{ color: isSelected ? mark?.hex : undefined }}>
                      {mark && (
                        <svg
                          viewBox={mark.viewBox}
                          className={`h-full w-full ${isSelected ? '' : 'text-faded'}`}
                          dangerouslySetInnerHTML={{ __html: mark.body }}
                        />
                      )}
                    </span>
                    <span className={isSelected ? 'text-blueprint underline decoration-redline decoration-2 underline-offset-4' : 'text-blueprint'}>
                      {p.skill.name}
                    </span>
                  </button>
                </td>
                <td className="hidden py-1 text-faded sm:table-cell">{p.skill.note}</td>
                <td className="figures py-1 pr-3 text-right text-blueprint">{p.qty === 0 ? <span className="text-faded">—</span> : p.qty}</td>
              </tr>
              {isSelected && inlineDetail && (
                <tr>
                  <td colSpan={4} className="p-0">
                    {inlineDetail}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
