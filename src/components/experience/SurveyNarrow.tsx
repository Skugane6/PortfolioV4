import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, useInView, useMotionValue } from 'motion/react';
import type { Role } from '../../content/types';
import { aircraft } from '../../content/aircraft';
import { ease } from '../../lib/motion';
import { Airframe } from '../drawing/Airframe';
import { Stamp } from '../drawing/Stamp';
import { CalloutCard } from './CalloutCard';

interface SurveyNarrowProps {
  role: Role;
  animated: boolean;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  header: ReactNode;
  airframeRef: React.RefObject<HTMLDivElement>;
}

/**
 * Sheet 02 below 1024×700: no pinning. The airframe sticks at the top of the
 * sheet while the cards pass under it in normal scroll, and the card at the
 * middle of the screen lights its station, so the drawing always shows which
 * part of it is being read.
 */
export function SurveyNarrow({ role, animated, hovered, setHovered, header, airframeRef }: SurveyNarrowProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const [inView, setInView] = useState<string | null>(null);
  const plot = useMotionValue(animated ? 0 : 1);
  const drawingInView = useInView(airframeRef, { once: true, amount: 0.5 });

  // Plot the drawing once, the first time it is properly on screen.
  useEffect(() => {
    if (!animated) {
      plot.set(1);
      return;
    }
    if (!drawingInView) return;
    const controls = animate(plot, 1, { duration: 0.9, ease: ease.pen });
    return () => controls.stop();
  }, [animated, drawingInView, plot]);

  // The card crossing the middle of the viewport is the one being read.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setInView(e.target.getAttribute('data-callout'));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    list.querySelectorAll('[data-callout]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const active = hovered ?? inView;
  const current = role.callouts.find((c) => c.id === active);

  return (
    <div className="px-4 pb-10 pt-10 sm:px-8">
      {header}

      <div className="sticky top-0 z-20 -mx-4 mt-8 border-b border-construction/70 bg-cyanotype px-4 pb-3 pt-4 sm:-mx-8 sm:px-8">
        <div ref={airframeRef} className="relative">
          <Airframe
            detail="full"
            labels={false}
            title={`View A: side elevation of a ${aircraft.family} regional jet, drawn as line art, with ${role.callouts.length} stations marked`}
            plot={plot}
            stations={role.callouts.map((c) => ({ id: c.id, station: c.station, zone: c.zone, subject: c.title }))}
            activeStation={active}
            onStationActivate={setHovered}
            onStationSelect={(id) => document.getElementById(`callout-${id}`)?.focus()}
          />
        </div>
        <p aria-hidden="true" className="mt-2 flex h-5 items-baseline gap-3 text-label">
          {current ? (
            <>
              <span className="lettering font-mono text-redline">STA {current.station}</span>
              <span className="text-faded">{current.zone}</span>
            </>
          ) : (
            <span className="text-faded">{role.callouts.length} stations, fore to aft</span>
          )}
          <span className="ml-auto whitespace-nowrap text-faded">
            <span className="lettering font-mono text-blueprint">View A</span>
            <span className="ml-2 hidden sm:inline">Side elevation, {aircraft.drawnAs}</span>
          </span>
        </p>
      </div>

      <ol ref={listRef} className="mt-8 grid gap-6 sm:grid-cols-2">
        {role.callouts.map((c) => (
          <li key={c.id} data-callout={c.id}>
            <CalloutCard callout={c} active={active === c.id} onActivate={setHovered} className="h-full" />
          </li>
        ))}
      </ol>

      <div className="mt-8 flex justify-end">
        <Stamp lines={['Survey complete', `Inspected ${role.end}`]} />
      </div>
    </div>
  );
}
