import type { ReactNode } from 'react';
import buildInfo from 'virtual:build-info';
import { pad2, sheets } from '../../content/sheets';
import type { SheetMeta } from '../../content/types';
import { TitleBlock, type TitleBlockRow } from './TitleBlock';

const ZONE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ZONE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface SheetFrameProps {
  sheet: SheetMeta;
  children: ReactNode;
  /** Extra title-block fields after SHEET / TITLE / REV / DATE. */
  extraRows?: TitleBlockRow[];
  /** Replace the standard title block entirely (the cover draws its own). */
  titleBlock?: ReactNode;
  className?: string;
}

/**
 * One sheet of the drawing set: a section with zone references along its top
 * and left edges (from 1024px), its content, and the sheet's title block at
 * the foot, closed by the sheet-break rule. Zones are real references: the
 * drafting crosshair reports them.
 */
export function SheetFrame({ sheet, children, extraRows = [], titleBlock, className = '' }: SheetFrameProps) {
  const rows: TitleBlockRow[] = [
    { label: 'Sheet', value: `${pad2(sheet.number)} of ${pad2(sheets.length)}`, data: true },
    { label: 'Title', value: sheet.drawingTitle, span: 2 },
    { label: 'Rev', value: buildInfo.hash, data: true },
    { label: 'Date', value: buildInfo.date, data: true },
    ...extraRows,
  ];

  return (
    <section
      id={sheet.id}
      aria-labelledby={`${sheet.id}-title`}
      data-sheet={sheet.number}
      className={`sheet relative border-b-2 border-construction ${className}`}
    >
      <ZoneRefs />
      {children}
      {titleBlock ?? (
        <div className="relative px-4 pb-6 sm:px-6 lg:px-10">
          <TitleBlock
            label={`Sheet ${pad2(sheet.number)} title block`}
            rows={rows}
            columns={Math.min(rows.length + 1, 6)}
            className="ml-auto max-w-[720px]"
          />
        </div>
      )}
    </section>
  );
}

function ZoneRefs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none lg:block">
      <div className="absolute inset-x-0 top-0 flex h-6 border-b border-construction">
        {ZONE_NUMBERS.map((n) => (
          <span
            key={n}
            data-zone-col={n}
            className="flex flex-1 items-center justify-center border-l border-construction/60 font-mono text-label text-faded first:border-l-0"
          >
            {n}
          </span>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 top-6 flex w-6 flex-col border-r border-construction">
        {ZONE_LETTERS.map((l) => (
          <span
            key={l}
            data-zone-row={l}
            className="flex flex-1 items-center justify-center border-t border-construction/60 font-mono text-label text-faded"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
