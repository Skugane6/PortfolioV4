import { useEffect, useRef, type CSSProperties } from 'react';
import { m, useTransform, type MotionValue } from 'motion/react';
import { xFromStation } from '../../lib/stations';
import { CENTER, HIDDEN, OBJECT, PANEL, THIN, VIEWBOX, fuselageExtent } from './airframeGeometry';

/** Drawing x of the aftmost point. */
const EXTENT_X = 2106;

export interface StationMark {
  id: string;
  station: number;
  zone: string;
  /** Accessible name of what the station annotates, e.g. the callout title. */
  subject: string;
}

interface AirframeProps {
  /** 'key' is the small cover drawing: outline and details only. */
  detail: 'key' | 'full';
  /** Accessible title of the drawing. */
  title: string;
  /** Plot progress 0→1. Omitted means fully drawn (static). */
  plot?: MotionValue<number>;
  stations?: StationMark[];
  activeStation?: string | null;
  /** Hover or focus on a station button. */
  onStationActivate?: (id: string | null) => void;
  /** Click or Enter on a station button. */
  onStationSelect?: (id: string) => void;
  className?: string;
}

// Plot windows within `plot` (0→1): the outline first, details overlapping
// its end, then construction (hidden, centre and panel lines) fading in.
const WINDOWS = {
  object: [0, 0.55],
  thin: [0.3, 0.85],
  construction: [0.7, 1],
} as const;

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * The airframe as line art. Line weights are in screen pixels whatever the
 * drawing's size: --u (viewBox units per CSS px) is measured on resize and
 * every stroke width and dash is a multiple of it. (vector-effect:
 * non-scaling-stroke would do this for free, but it breaks pathLength
 * plotting in Chromium.)
 */
export function Airframe({
  detail,
  title,
  plot,
  stations = [],
  activeStation = null,
  onStationActivate,
  onStationSelect,
  className = '',
}: AirframeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const measure = () => {
      const w = svg.getBoundingClientRect().width;
      if (w > 0) svg.style.setProperty('--u', String(VIEWBOX.w / w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const full = detail === 'full';
  const titleId = `airframe-title-${detail}`;

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        role="img"
        aria-labelledby={titleId}
        className="block h-auto w-full overflow-visible"
        style={{ ['--u' as string]: 2 } as CSSProperties}
      >
        <title id={titleId}>{title}</title>
        <Group className="airframe-construction" window={WINDOWS.construction} plot={plot} mode="fade">
          {full && <path className="line-center" d={CENTER.datum} />}
          {full && Object.values(HIDDEN).map((d) => <path key={d} className="line-hidden" d={d} />)}
          {full && <path className="line-panel" d={PANEL.seams} />}
        </Group>
        <Group className="line-thin" window={WINDOWS.thin} plot={plot} mode="draw">
          {Object.values(THIN)}
        </Group>
        <Group className="line-object" window={WINDOWS.object} plot={plot} mode="draw">
          {Object.values(OBJECT)}
        </Group>

        {stations.map((s) => {
          const x = xFromStation(s.station);
          const { top, bottom, clear } = fuselageExtent(x);
          const active = s.id === activeStation;
          return (
            <g key={s.id} className={active ? 'station station-active' : 'station'} aria-hidden="true">
              <path className="station-plane" d={`M ${x} ${Math.min(top, clear) - 34} L ${x} ${bottom + 34}`} />
              <circle className="station-dot" cx={x} cy={292} />
            </g>
          );
        })}
      </svg>

      {/* Station controls sit over the drawing as real buttons, so they are
          focusable and named; the SVG above draws only their marks. */}
      {stations.map((s) => {
        const x = xFromStation(s.station);
        const { clear } = fuselageExtent(x);
        const active = s.id === activeStation;
        // Aft of the wing the fin rises behind the station line, so the label
        // reads forward from the line into open sky instead of across the fin.
        const aft = x > 0.8 * EXTENT_X;
        return (
          <div key={s.id}>
            <span
              aria-hidden="true"
              className={`lettering pointer-events-none absolute -translate-y-full whitespace-nowrap font-mono text-label transition-colors duration-quick ${
                aft ? '-translate-x-[calc(100%+6px)]' : '-translate-x-1/2'
              } ${
                active ? 'text-redline' : 'text-faded'
              }`}
              style={{ left: pct(x - VIEWBOX.x, VIEWBOX.w), top: pct((aft ? clear + 10 : clear - 42) - VIEWBOX.y, VIEWBOX.h) }}
            >
              STA {s.station}
            </span>
            <button
              type="button"
              aria-label={`Station ${s.station}, ${s.zone}: ${s.subject}`}
              aria-controls={`callout-${s.id}`}
              aria-pressed={active}
              onPointerEnter={() => onStationActivate?.(s.id)}
              onPointerLeave={() => onStationActivate?.(null)}
              onFocus={() => onStationActivate?.(s.id)}
              onBlur={() => onStationActivate?.(null)}
              onClick={() => onStationSelect?.(s.id)}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: pct(x - VIEWBOX.x, VIEWBOX.w), top: pct(292 - VIEWBOX.y, VIEWBOX.h) }}
            />
          </div>
        );
      })}
    </div>
  );
}

interface GroupProps {
  className: string;
  window: readonly [number, number];
  plot?: MotionValue<number>;
  mode: 'draw' | 'fade';
  children: React.ReactNode;
}

/** A set of paths plotted together: drawn by pathLength, or faded in. */
function Group({ className, window, plot, mode, children }: GroupProps) {
  const paths = Array.isArray(children) ? children : [children];
  if (!plot) {
    return (
      <g className={className}>
        {paths.map((child, i) => (typeof child === 'string' ? <path key={i} d={child} /> : child))}
      </g>
    );
  }
  return <PlottedGroup className={className} window={window} plot={plot} mode={mode} paths={paths} />;
}

function PlottedGroup({
  className,
  window,
  plot,
  mode,
  paths,
}: Omit<GroupProps, 'children' | 'plot'> & { plot: MotionValue<number>; paths: React.ReactNode[] }) {
  const progress = useTransform(plot, [window[0], window[1]], [0, 1], { clamp: true });
  if (mode === 'fade') {
    return (
      <m.g className={className} style={{ opacity: progress }}>
        {paths}
      </m.g>
    );
  }
  return (
    <g className={className}>
      {paths.map((d, i) => (typeof d === 'string' ? <m.path key={i} d={d} style={{ pathLength: progress }} /> : d))}
    </g>
  );
}
