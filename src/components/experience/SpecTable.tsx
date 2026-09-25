import { aircraft } from '../../content/aircraft';

/** Published dimensions, one aircraft per column, with where they come from. */
export function SpecTable() {
  return (
    <figure>
      <table className="ground w-full border-collapse text-small">
        <caption className="pb-2 text-left text-label text-faded">
          <span className="lettering">{aircraft.family}</span>, {aircraft.kind.toLowerCase()}. Published dimensions (sources in{' '}
          <a href="#spec-sources" className="link">
            note 1
          </a>
          ).
        </caption>
        <thead>
          <tr className="border-b border-faded/60">
            <th scope="col" className="py-2 pr-4 text-left font-normal text-faded">
              <span className="sr-only">Dimension</span>
            </th>
            <th scope="col" className="lettering py-2 pr-4 text-right font-mono text-label font-normal text-faded">
              CRJ700
            </th>
            <th scope="col" className="lettering py-2 text-right font-mono text-label font-normal text-faded">
              CRJ900
            </th>
          </tr>
        </thead>
        <tbody>
          {aircraft.spec.map((row) => (
            <tr key={row.label} className="border-b border-faded/30">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-faded">
                {row.label}
              </th>
              <td className="figures py-2 pr-4 text-right text-blueprint">{row.crj700}</td>
              <td className="figures py-2 text-right text-blueprint">{row.crj900}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
