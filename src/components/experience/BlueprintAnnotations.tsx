/**
 * The drafting furniture around the Experience sheet: the overall-length
 * dimension, station notes, datum stamp and registration marks a real side
 * elevation carries.
 *
 * All of it is deliberately quieter than the callout cards — a light steel
 * ink at low alpha — and every piece rides the shared `--ann` alpha, which
 * Experience drives to zero as the first callouts arrive. It is the sheet's
 * resting state, not competition for the cards.
 */

// How much of the sheet the viewport can carry. The reference drawing is a
// 1600px-wide plate; a phone gets the dimension line and nothing else, which
// is the honest answer rather than a shrunken pile of 6px type.
export type SheetDetail = 'full' | 'mid' | 'compact';

const RULE = 'rgba(122,160,216,0.34)';
const RULE_SOFT = 'rgba(122,160,216,0.22)';
const TEXT = 'rgba(158,192,232,0.62)';
const TEXT_SOFT = 'rgba(158,192,232,0.4)';

export const AIRCRAFT = {
  model: 'CRJ700 / 900',
  kind: 'Regional jet',
  dimensions: [
    ['Length', '32.5 m'],
    ['Wingspan', '24.9 m'],
    ['Height', '7.5 m'],
  ],
  overall: '32.5 m (106.6 ft)',
  // Toronto Pearson — the field the fleet this work covered flies out of, and
  // the closest airport to the office the role was based in.
  datum: 'CYYZ  N 43.6777°  W 79.6248°',
  stations: [
    { at: 6, label: 'Nose section', sta: 'STA 0 – 145' },
    { at: 46, label: 'Main wing', sta: 'STA 410' },
    { at: 77, label: 'Aft section', sta: 'STA 760+' },
  ],
};

const note = 'font-mono text-[8px] uppercase leading-none tracking-[0.14em] md:text-[9px]';

// Arrow-and-tick cap, the drafting convention for a dimension that runs to a
// hard extent rather than trailing off.
function DimCap({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right' ? 'scaleX(-1)' : undefined;
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      aria-hidden="true"
      className="shrink-0"
      style={{ color: RULE, transform: flip }}
    >
      <path d="M8.5 1.4 1.6 4.5l6.9 3.1Z" fill="currentColor" />
      <path d="M1 0v9" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// Registration crosshair, one per sheet corner.
function RegMark({ position }: { position: string }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      aria-hidden="true"
      className={`absolute ${position}`}
      style={{ color: RULE }}
    >
      <path d="M10.5 0v21M0 10.5h21" stroke="currentColor" strokeWidth="1" />
      <circle cx="10.5" cy="10.5" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/**
 * Notes that belong to the airframe itself, in plate coordinates. Render this
 * inside the plate and under the same parallax transform as the image, so the
 * dimension keeps measuring the thing it points at.
 */
export function AirframeNotes({ detail }: { detail: SheetDetail }) {
  const dense = detail !== 'compact';

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 'var(--ann, 1)' }}>
      {/* Overall length. The airframe fills the plate top to bottom, so the
          only clear run is the sky above the fuselage; the rule crosses the
          fin on its way to the tail, which is what a dimension line does on a
          real drawing. The label breaks the rule rather than sitting over it —
          that band is only a few px tall once the plate is phone-sized.

          On a phone the sheet is short enough that the assembly rides up under
          the HUD band, so the dimension drops into the clear air between the
          airframe and the callout instead. */}
      <div
        className="absolute flex items-center gap-2"
        style={{
          left: '2%',
          right: '2%',
          top: dense ? '11%' : 'calc(100% + 13px)',
          transform: 'translateY(-50%)',
        }}
      >
        <DimCap side="left" />
        <span className="h-px flex-1" style={{ background: RULE_SOFT }} />
        <span className={`${note} whitespace-nowrap`} style={{ color: TEXT }}>
          Overall length
          <span className="ml-2 normal-case" style={{ color: TEXT_SOFT }}>
            {AIRCRAFT.overall}
          </span>
        </span>
        <span className="h-px flex-1" style={{ background: RULE_SOFT }} />
        <DimCap side="right" />
      </div>

      {dense && (
        <span className={`${note} absolute whitespace-nowrap`} style={{ left: '7%', top: '21%', color: TEXT_SOFT }}>
          {AIRCRAFT.datum}
        </span>
      )}

      {/* Station notes hang in the band between the airframe and the cards,
          each on a tick that rises to the belly line. */}
      {dense &&
        AIRCRAFT.stations.map((station) => (
          <div key={station.sta} className="absolute" style={{ left: `${station.at}%`, top: '100%' }}>
            <span className="absolute bottom-0 left-0 w-px" style={{ height: 7, background: RULE }} />
            <span className={`${note} absolute left-[5px] top-[3px] whitespace-nowrap`} style={{ color: TEXT }}>
              {station.label}
              <span className="ml-2" style={{ color: TEXT_SOFT }}>
                {station.sta}
              </span>
            </span>
          </div>
        ))}

      {/* Detail-view frames, the dashed boxes a drawing uses to flag a region
          enlarged on another sheet. */}
      {dense && (
        <>
          <span
            className="absolute"
            style={{ left: '33%', top: '19%', width: '9%', height: '15%', border: `1px dashed ${RULE_SOFT}` }}
          />
          <span
            className="absolute"
            style={{ left: '60%', top: '19%', width: '9%', height: '15%', border: `1px dashed ${RULE_SOFT}` }}
          />
        </>
      )}

      {/* Survey crosses on the datum grid. */}
      {[
        [14, 35],
        [74, 33],
        [46, 4],
      ].map(([x, y]) => (
        <svg
          key={`${x}-${y}`}
          width="9"
          height="9"
          viewBox="0 0 9 9"
          aria-hidden="true"
          className="absolute -ml-[4.5px] -mt-[4.5px]"
          style={{ left: `${x}%`, top: `${y}%`, color: RULE }}
        >
          <path d="M4.5 0v9M0 4.5h9" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Furniture that belongs to the sheet rather than the airframe: registration
 * marks at the corners, the flight-direction note, and the colophon. Render
 * at stage level, outside the parallax — these define the sheet, so they are
 * the one thing that should not drift.
 */
export function SheetMarks({ detail }: { detail: SheetDetail }) {
  if (detail === 'compact') return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 'var(--ann, 1)' }}>
      <RegMark position="left-3 top-3" />
      <RegMark position="right-3 top-3" />
      <RegMark position="left-3 bottom-3" />
      <RegMark position="right-3 bottom-3" />

      {/* Only on the widest sheet: below that the airframe reaches too far
          into the margin for a note to sit beside it. --planey puts it level
          with the fuselage rather than with the stage's midline. */}
      {detail === 'full' && (
        <div className="absolute left-8 -translate-y-1/2" style={{ top: 'var(--planey, 50%)' }}>
          <div className={note} style={{ color: TEXT }}>
            Flight
          </div>
          <div className={`${note} mt-[5px]`} style={{ color: TEXT }}>
            Direction
          </div>
          <svg width="46" height="7" viewBox="0 0 46 7" aria-hidden="true" className="mt-2" style={{ color: RULE }}>
            <path d="M0 3.5h46" stroke="currentColor" strokeWidth="1" />
            <path d="M0 3.5 7 0v7Z" fill="currentColor" />
          </svg>
        </div>
      )}

      {detail === 'full' && (
        <div className="absolute bottom-[112px] left-8">
          <span className="mb-2 block h-px w-7" style={{ background: RULE }} />
          {['Aviation', 'Data', 'Builds', 'Tomorrow'].map((word) => (
            <div key={word} className={`${note} mt-[5px]`} style={{ color: TEXT_SOFT }}>
              {word}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The sheet's specification table. Lives in the top-right HUD stack, under the
 * survey readout, so it reads as part of the drawing's title data.
 */
export function SpecBlock() {
  return (
    <div aria-hidden="true" className="mt-5 w-[148px]" style={{ opacity: 'var(--ann, 1)' }}>
      <div className={note} style={{ color: TEXT }}>
        {AIRCRAFT.model}
      </div>
      <div className={`${note} mt-[5px]`} style={{ color: TEXT_SOFT }}>
        {AIRCRAFT.kind}
      </div>
      <span className="mb-[7px] mt-[9px] block h-px w-full" style={{ background: RULE }} />
      {AIRCRAFT.dimensions.map(([label, value]) => (
        <div key={label} className={`${note} mt-[6px] flex justify-between gap-3`}>
          <span style={{ color: TEXT_SOFT }}>{label}</span>
          <span className="normal-case" style={{ color: TEXT }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
