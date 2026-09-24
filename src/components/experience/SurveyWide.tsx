import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { m, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { Role } from '../../content/types';
import { aircraft } from '../../content/aircraft';
import { xFromStation } from '../../lib/stations';
import { Airframe } from '../drawing/Airframe';
import { Dimension } from '../drawing/Dimension';
import { Stamp } from '../drawing/Stamp';
import { EXTENT, VIEWBOX } from '../drawing/airframeGeometry';
import { CalloutCard } from './CalloutCard';
import { dockAt, dockParts, progressForCallout, stampAt, surveyPhases } from './survey';

interface SurveyWideProps {
  role: Role;
  /** False renders the finished sheet: nothing pinned, nothing moving. */
  animated: boolean;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  header: ReactNode;
  airframeRef: React.RefObject<HTMLDivElement>;
}

interface Geometry {
  dots: { x: number; y: number }[];
  cards: { x: number; top: number }[];
  railY: number;
}

const DATUM_Y = 292;
const BELLY_Y = 420;

/**
 * Sheet 02 from 1024×700 up. The airframe plots itself while the sheet
 * scrolls into view; the sheet then pins and each callout docks in turn,
 * fore to aft: its station lights, a leader drops to its card, the card
 * appears. At 100% the inspection stamp lands. Keyboard focus anywhere in
 * the survey completes it at once, so nothing focusable is ever invisible.
 */
export function SurveyWide({ role, animated, hovered, setHovered, header, airframeRef }: SurveyWideProps) {
  const n = role.callouts.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [scrollActive, setScrollActive] = useState<string | null>(null);

  // 1 once a keyboard user has focused into the survey: everything shown.
  const reveal = useMotionValue(animated ? 0 : 1);
  useEffect(() => reveal.set(animated ? 0 : 1), [animated, reveal]);

  const { scrollYProgress: entry } = useScroll({ target: trackRef, offset: ['start end', 'start start'] });
  const { scrollYProgress: pinned } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const plot = useTransform(entry, [0.2, 0.9], [0, 1]);
  const stamp = useTransform([pinned, reveal] as MotionValue<number>[], ([p, r]: number[]) => Math.max(stampAt(p), r));
  const stampScale = useTransform(stamp, [0, 1], [1.25, 1]);

  useMotionValueEvent(pinned, 'change', (p) => {
    if (!animated) return;
    const phases = surveyPhases(p, n);
    const r = reveal.get();
    const percent = r >= 1 ? 100 : phases.percent;
    if (readoutRef.current) readoutRef.current.textContent = `${percent}%`;
    if (barRef.current) barRef.current.style.transform = `scaleX(${percent / 100})`;
    let last = -1;
    phases.docks.forEach((d, i) => {
      if (d > 0.6) last = i;
    });
    const next = last >= 0 && p < 0.99 ? role.callouts[last].id : null;
    setScrollActive((prev) => (prev === next ? prev : next));
  });

  // Leader geometry: station dots on the drawing, card tops below. Card
  // positions use offset* so the cards' own appear transform doesn't skew them.
  useEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;
    const measure = () => {
      const svg = layout.querySelector('svg[data-airframe]');
      if (!svg) return;
      const box = layout.getBoundingClientRect();
      const s = svg.getBoundingClientRect();
      const toX = (x: number) => s.left - box.left + ((x - VIEWBOX.x) / VIEWBOX.w) * s.width;
      const toY = (y: number) => s.top - box.top + ((y - VIEWBOX.y) / VIEWBOX.h) * s.height;
      const cards = cardRefs.current.map((el) => (el ? { x: el.offsetLeft + el.offsetWidth / 2, top: el.offsetTop } : { x: 0, top: 0 }));
      const belly = toY(BELLY_Y);
      const firstCard = Math.min(...cards.map((c) => c.top));
      setGeo({
        dots: role.callouts.map((c) => ({ x: toX(xFromStation(c.station)), y: toY(DATUM_Y) })),
        cards,
        railY: belly + (firstCard - belly) * 0.55,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(layout);
    cardRefs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [role]);

  const onFocusCapture = (e: FocusEvent) => {
    if ((e.target as HTMLElement).matches(':focus-visible')) {
      reveal.set(1);
      if (readoutRef.current) readoutRef.current.textContent = '100%';
      if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
    }
  };

  const selectStation = (id: string) => {
    const i = role.callouts.findIndex((c) => c.id === id);
    const track = trackRef.current;
    const card = document.getElementById(`callout-${id}`);
    if (animated && track && reveal.get() < 1) {
      const top = track.getBoundingClientRect().top + scrollY;
      const range = track.offsetHeight - innerHeight;
      scrollTo({ top: top + progressForCallout(i, n) * range, behavior: 'smooth' });
    }
    card?.focus({ preventScroll: animated });
  };

  const active = hovered ?? scrollActive;

  const stage = (
    <div
      className={`${animated ? 'sticky top-0 h-[100svh]' : ''} flex flex-col justify-center px-6 py-10 lg:pl-16 lg:pr-12 [@media(max-height:860px)]:py-5`}
      onFocusCapture={onFocusCapture}
    >
      <div className="flex items-end justify-between gap-8">
        {header}
        <div aria-hidden="true" className="shrink-0 text-right">
          <p className="lettering text-label text-faded">Survey</p>
          <p className="mt-1 flex items-center justify-end gap-3">
            <span className="relative block h-[2px] w-40 bg-construction/50">
              <span
                ref={barRef}
                className="absolute inset-0 origin-left bg-redline"
                style={{ transform: `scaleX(${animated ? 0 : 1})` }}
              />
            </span>
            <span ref={readoutRef} className="figures w-[4.6ch] text-right text-data-lg font-bold text-blueprint">
              {animated ? '0%' : '100%'}
            </span>
          </p>
        </div>
      </div>

      <div ref={layoutRef} className="relative mt-12 [@media(max-height:860px)]:mt-10">
        <div ref={airframeRef} className="relative">
          <Dimension label="Overall length" value={aircraft.overallLength} from={EXTENT.left} to={EXTENT.right} className="-top-9" />
          <Airframe
            detail="full"
            title={`Side elevation of a ${aircraft.family} regional jet, drawn as line art, with ${n} stations marked`}
            plot={animated ? plot : undefined}
            stations={role.callouts.map((c) => ({ id: c.id, station: c.station, zone: c.zone, subject: c.title }))}
            activeStation={active}
            onStationActivate={setHovered}
            onStationSelect={selectStation}
          />
          <m.div
            className="pointer-events-none absolute left-[21%] top-[2%]"
            style={animated ? { opacity: stamp, scale: stampScale } : undefined}
          >
            <Stamp lines={['Survey complete', `Inspected ${role.end}`]} />
          </m.div>
        </div>

        <div className="h-16 [@media(max-height:860px)]:h-10" aria-hidden="true" />

        <div className="grid items-end gap-5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {role.callouts.map((c, i) => (
            <Dock
              key={c.id}
              index={i}
              n={n}
              pinned={pinned}
              reveal={reveal}
              animated={animated}
              render={(appear) => (
                <div ref={(el) => (cardRefs.current[i] = el)} className="relative z-10">
                  <CalloutCard callout={c} active={active === c.id} onActivate={setHovered} appear={appear} />
                </div>
              )}
            />
          ))}
        </div>

        {geo && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {role.callouts.map((c, i) => (
              <Leader
                key={c.id}
                index={i}
                n={n}
                pinned={pinned}
                reveal={reveal}
                animated={animated}
                dot={geo.dots[i]}
                card={geo.cards[i]}
                railY={geo.railY}
                active={active === c.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // The track is always rendered (useScroll needs its target mounted); only
  // the animated version gets the height the sticky stage travels over.
  return (
    <div ref={trackRef} className="relative" style={animated ? { height: `${(n + 1) * 65}vh` } : undefined}>
      {stage}
    </div>
  );
}

function useDock(index: number, n: number, pinned: MotionValue<number>, reveal: MotionValue<number>) {
  return useTransform([pinned, reveal] as MotionValue<number>[], ([p, r]: number[]) => Math.max(dockAt(p, index, n), r));
}

interface DockProps {
  index: number;
  n: number;
  pinned: MotionValue<number>;
  reveal: MotionValue<number>;
  animated: boolean;
  render: (appear?: { opacity: MotionValue<number>; y: MotionValue<number> }) => ReactNode;
}

function Dock({ index, n, pinned, reveal, animated, render }: DockProps) {
  const d = useDock(index, n, pinned, reveal);
  const opacity = useTransform(d, (v) => dockParts(v).card);
  const y = useTransform(opacity, [0, 1], [14, 0]);
  return <>{render(animated ? { opacity, y } : undefined)}</>;
}

interface LeaderProps {
  index: number;
  n: number;
  pinned: MotionValue<number>;
  reveal: MotionValue<number>;
  animated: boolean;
  dot: { x: number; y: number };
  card: { x: number; top: number };
  railY: number;
  active: boolean;
}

/** A drafting leader in three strokes: down from the station, across, down into the card. */
function Leader({ index, n, pinned, reveal, animated, dot, card, railY, active }: LeaderProps) {
  const d = useDock(index, n, pinned, reveal);
  const down = useTransform(d, (v) => dockParts(v).leaderDown);
  const across = useTransform(d, (v) => dockParts(v).leaderAcross);
  const into = useTransform(d, (v) => dockParts(v).leaderIn);
  const colour = active ? 'bg-redline' : 'bg-faded/80';
  const still = !animated;
  const rightward = card.x >= dot.x;

  return (
    <>
      <m.span
        className={`absolute w-px origin-top ${colour}`}
        style={{ left: dot.x, top: dot.y, height: Math.max(0, railY - dot.y), scaleY: still ? 1 : down }}
      />
      <m.span
        className={`absolute h-px ${colour}`}
        style={{
          top: railY,
          left: Math.min(dot.x, card.x),
          width: Math.abs(card.x - dot.x) + 1,
          scaleX: still ? 1 : across,
          originX: rightward ? 0 : 1,
        }}
      />
      <m.span
        className={`absolute w-px origin-top ${colour}`}
        style={{ left: card.x, top: railY, height: Math.max(0, card.top - railY), scaleY: still ? 1 : into }}
      />
      <m.span
        className={`absolute -ml-[3px] -mt-[3px] h-[7px] w-[7px] rounded-full ${active ? 'bg-redline' : 'bg-faded'}`}
        style={{ left: card.x, top: card.top, scale: still ? 1 : into }}
      />
    </>
  );
}
