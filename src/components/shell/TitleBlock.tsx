import type { ReactNode } from 'react';

export interface TitleBlockRow {
  label: string;
  value: ReactNode;
  /** Columns this cell spans at the widest breakpoint. */
  span?: number;
  /** Render the value in the data face (B612 Mono). */
  data?: boolean;
}

interface TitleBlockProps {
  rows: TitleBlockRow[];
  /** Grid columns from 640px up. Below that the block is two columns. */
  columns?: number;
  className?: string;
  /** Accessible name for the block, which is a description list. */
  label: string;
}

/**
 * A drawing title block: ruled cells, each a field name over a value, marked
 * up as a description list so the pairs read as pairs.
 *
 * On a phone the block is two columns: wide cells take a full row, and when
 * the narrow cells don't pair up evenly the last one takes the full row too,
 * so the ruled grid never has a missing cell.
 */
export function TitleBlock({ rows, columns = 4, className = '', label }: TitleBlockProps) {
  const narrow = rows.filter((r) => !r.span || r.span < 2);
  const lastNarrow = narrow.length % 2 === 1 ? narrow[narrow.length - 1] : null;

  return (
    <dl
      aria-label={label}
      className={`tb grid-cols-2 max-sm:grid-flow-row-dense sm:[grid-template-columns:repeat(var(--tb-cols),minmax(0,1fr))] ${className}`}
      style={{ ['--tb-cols' as string]: columns }}
    >
      {rows.map((row) => {
        const wide = (row.span ?? 1) >= 2;
        const span = Math.min(row.span ?? 1, columns);
        return (
          <div
            key={row.label}
            className={`tb-cell ${wide || row === lastNarrow ? 'max-sm:col-span-2' : ''} ${span > 1 ? 'sm:[grid-column:span_var(--span)/span_var(--span)]' : ''}`}
            style={span > 1 ? { ['--span' as string]: span } : undefined}
          >
            <dt className="tb-label">{row.label}</dt>
            <dd className={`tb-value ${row.data ? 'font-mono text-data' : ''}`}>{row.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
