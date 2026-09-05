import type { CSSProperties } from 'react';
import type { ExperienceCallout } from '../../data/types';

// The panel's 45° corner cut, and the offset outline that repeats it. Both are
// fixed px rather than %: a percentage chamfer skews off 45° as soon as the
// card stops being square, and these cards change aspect ratio with their text.
const CHAMFER = 22;
// Gap between the panel edge and the offset outline, drafting-style. The card
// element owns this as padding so the outline is inside its measured box —
// Experience's fit() sizes the whole assembly off those boxes.
export const RING_INSET = 9;
// Edge weight of the plate. The plate is two clipped layers, and this is how
// far the inner one is inset, so it is what actually shows as the border.
const EDGE = 1.5;

const DIAG = CHAMFER * Math.SQRT2;

function octagon(c: number) {
  return `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;
}

// Slanted rule marks, as on a drawing's cut-line annotations. Discrete bars
// rather than a repeating gradient, so the run never opens or closes on a
// half-cut stripe at whatever width it happens to land on.
function Hatch({ count, height }: { count: number; height: number }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-[2.5px]">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="block w-[3px] bg-[rgba(112,178,252,0.85)]"
          style={{ height, transform: 'skewX(-22deg)' }}
        />
      ))}
    </span>
  );
}

// The offset outline. Drawn as eight positioned rules — four edges plus four
// rotated diagonals — rather than a clip-path ring, because CSS has no way to
// punch a chamfered hole through a chamfered box, and the gap band has to stay
// transparent so the blueprint grid and leader lines read through it.
function OffsetOutline() {
  const rule = 'absolute bg-[rgba(132,192,252,0.62)]';
  const diag: CSSProperties = { width: `${DIAG}px`, height: '1px' };
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <span className={rule} style={{ left: CHAMFER, right: CHAMFER, top: 0, height: 1 }} />
      <span className={rule} style={{ left: CHAMFER, right: CHAMFER, bottom: 0, height: 1 }} />
      <span className={rule} style={{ top: CHAMFER, bottom: CHAMFER, left: 0, width: 1 }} />
      <span className={rule} style={{ top: CHAMFER, bottom: CHAMFER, right: 0, width: 1 }} />
      <span className={rule} style={{ ...diag, left: 0, top: CHAMFER, transformOrigin: '0 0', transform: 'rotate(-45deg)' }} />
      <span className={rule} style={{ ...diag, right: 0, top: CHAMFER, transformOrigin: '100% 0', transform: 'rotate(45deg)' }} />
      <span className={rule} style={{ ...diag, left: 0, bottom: CHAMFER, transformOrigin: '0 100%', transform: 'rotate(45deg)' }} />
      <span className={rule} style={{ ...diag, right: 0, bottom: CHAMFER, transformOrigin: '100% 100%', transform: 'rotate(-45deg)' }} />

      {/* Witness ticks on the left rail, and a dimension stub on the right. */}
      <span className={rule} style={{ left: -4, top: '38%', width: 9, height: 1 }} />
      <span className={rule} style={{ left: -4, top: 'calc(38% + 6px)', width: 9, height: 1 }} />
      <span className={rule} style={{ right: -5, top: '46%', width: 1, height: 26, opacity: 0.7 }} />
    </div>
  );
}

const ICONS: Record<ExperienceCallout['icon'], JSX.Element> = {
  tracker: (
    <g>
      <path d="M2 4.6 8 1.6l6 3-6 3-6-3Z" />
      <path d="m2 8 6 3 6-3" />
      <path d="m2 11.4 6 3 6-3" />
    </g>
  ),
  chart: (
    <g>
      <path d="M2.4 14h11.2" />
      <path d="M4.4 14V8.2M8 14V3.4M11.6 14v-4" />
    </g>
  ),
  plane: (
    <g>
      <path d="M8 1.4c.85 0 1.35.95 1.35 2.1v2.8l4.85 2.85v1.7L9.35 9.5v3.05l1.6 1.15v1.15L8 14.1l-2.95.75V13.7l1.6-1.15V9.5L1.8 10.85v-1.7L6.65 6.3V3.5C6.65 2.35 7.15 1.4 8 1.4Z" />
    </g>
  ),
  schedule: (
    <g>
      <rect x="2" y="3.2" width="12" height="11" rx="1.4" />
      <path d="M2 6.6h12M5.4 1.8v2.6M10.6 1.8v2.6" />
      <path d="M5 9.4h1.2M9.8 9.4H11M5 11.8h1.2M9.8 11.8H11" />
    </g>
  ),
};

function Glyph({ name, size = 17 }: { name: ExperienceCallout['icon']; size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      style={{ width: size, height: size }}
      fill={name === 'plane' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={name === 'plane' ? 0.6 : 1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

interface HudCardProps {
  callout: ExperienceCallout;
  index: number;
}

/**
 * A callout panel in the language of the airframe drawing behind it: chamfered
 * plate, offset outline, station header, and a footer annotation strip.
 */
export function HudCard({ callout, index }: HudCardProps) {
  const metric = callout.tagVariant === 'metric';

  return (
    <div className="relative h-full" style={{ padding: RING_INSET }}>
      <OffsetOutline />

      {/* Border and plate are two clipped layers: the outer box's background is
          the edge itself, showing through the 1px the inner plate leaves. */}
      <div
        className="relative"
        style={{
          clipPath: octagon(CHAMFER),
          padding: EDGE,
          // Lit from the upper left, so the far edges — right and bottom —
          // take the highlight, as on the airframe render behind it.
          background:
            'linear-gradient(135deg, rgba(142,198,250,0.8) 0%, rgba(186,230,255,0.95) 38%, rgba(242,251,255,1) 74%, rgba(202,238,255,1) 100%)',
          filter:
            'drop-shadow(0 0 2px rgba(154,216,255,0.9)) drop-shadow(0 0 8px rgba(92,176,255,0.58)) drop-shadow(0 0 20px rgba(56,132,240,0.4)) drop-shadow(0 0 46px rgba(34,96,210,0.26))',
        }}
      >
        <div
          className="relative"
          style={{
            clipPath: octagon(CHAMFER - EDGE),
            backgroundColor: '#060d18',
            backgroundImage: [
              'linear-gradient(to right, rgba(120,175,240,0.075) 1px, transparent 1px)',
              'linear-gradient(to bottom, rgba(120,175,240,0.075) 1px, transparent 1px)',
              'radial-gradient(100% 110% at 2% 4%, rgba(44,96,178,0.2), transparent 48%)',
              'linear-gradient(155deg, rgba(12,27,52,0.97), rgba(7,15,29,0.985) 42%, rgba(5,11,21,0.99))',
            ].join(','),
            backgroundSize: '22px 22px, 22px 22px, auto, auto',
            // Tight to the rim: the plate reads near-black, lit only where the
            // edge glow spills over it.
            boxShadow: 'inset 0 0 26px -12px rgba(120,190,255,0.75)',
          }}
        >
          {/* The plate's left edge reads brightest, as if lit along the rail. */}
          <span
            aria-hidden="true"
            className="absolute left-0 w-[2.5px]"
            style={{
              top: CHAMFER - EDGE,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(216,240,255,1), rgba(96,168,250,0.12))',
              boxShadow: '0 0 12px rgba(140,205,255,0.8)',
            }}
          />

          <div className="px-[18px] pt-[12px]">
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-[17px] font-bold leading-none text-[#5fa8ff]"
                style={{ textShadow: '0 0 14px rgba(80,160,255,0.55)' }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] uppercase leading-none tracking-[0.22em] text-[#93aac8]">
                {callout.station}
              </span>
              <span className="ml-auto">
                <Hatch count={7} height={10} />
              </span>
            </div>

            <div className="mt-[9px] flex items-start justify-between gap-4">
              <h3 className="font-sans text-[22px] font-semibold leading-[1.16] tracking-[-0.012em] text-white">
                {callout.title}
              </h3>
              <span
                aria-hidden="true"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[7px] border border-[rgba(112,172,246,0.55)] bg-[rgba(34,80,146,0.32)] text-[#7cc0ff]"
                style={{ boxShadow: 'inset 0 0 14px rgba(88,164,250,0.28)' }}
              >
                <Glyph name={callout.icon} size={22} />
              </span>
            </div>

            <p className="mt-[9px] text-[13px] leading-[1.5] text-[#c6d6ea]" style={{ textWrap: 'pretty' }}>
              {callout.description}
            </p>

            <div className="mt-[12px] flex flex-wrap gap-2">
              {callout.tags.map((tag) => (
                <span
                  key={tag}
                  className={
                    metric
                      ? 'flex items-center gap-2 rounded-[5px] border border-[rgba(240,160,42,0.7)] px-[11px] py-[7px] font-mono text-[10.5px] uppercase tracking-[0.12em] text-amber-signal'
                      : 'rounded-[5px] border border-[rgba(88,158,240,0.7)] px-[11px] py-[7px] font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7cc0ff]'
                  }
                >
                  {metric && <Glyph name="chart" size={12} />}
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-[18px] mt-[11px] flex items-center gap-3 border-t border-[rgba(96,160,235,0.35)] py-[9px]">
            <Hatch count={4} height={8} />
            {/* Tracking is tight for a drafting annotation because the longest
                caption has to survive the narrowest card without truncating. */}
            <span className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-[#7f97b8]">
              {callout.caption}
            </span>
            <svg
              viewBox="0 0 14 14"
              aria-hidden="true"
              className="ml-auto h-[13px] w-[13px] shrink-0 text-[rgba(94,164,250,0.9)]"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <path d="M7 1.5v11M1.5 7h11" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
