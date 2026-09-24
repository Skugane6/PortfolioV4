import { useMotionValue } from 'motion/react';
import { LazyMotion, domMax } from 'motion/react';
import { useState } from 'react';
import { Airframe } from '../components/drawing/Airframe';
import { roles } from '../content/experience';
import { OgCard } from './OgCard';

/**
 * Dev-only fixtures (never in the production bundle: main.tsx imports this
 * only under import.meta.env.DEV). /?fixture=airframe renders the drawing in
 * isolation for screenshots and e2e geometry checks.
 */
export function Fixtures({ name }: { name: string }) {
  const plot = useMotionValue(0.5);
  const [active, setActive] = useState<string | null>('utilization-forecasting');
  const stations = roles[0].callouts.map((c) => ({ id: c.id, station: c.station, zone: c.zone, subject: c.title }));

  if (name === 'og') return <OgCard />;
  if (name !== 'airframe') return <p>Unknown fixture “{name}”.</p>;
  return (
    <LazyMotion features={domMax}>
      <div className="space-y-16 p-10">
        <section>
          <p className="mb-4 font-mono text-data text-faded">full, static, with stations</p>
          <Airframe detail="full" title="Airframe fixture" stations={stations} activeStation={active} onStationActivate={setActive} />
        </section>
        <section>
          <p className="mb-4 font-mono text-data text-faded">full, plot 0.5</p>
          <Airframe detail="full" title="Airframe fixture half plotted" plot={plot} />
        </section>
        <section className="max-w-[560px]">
          <p className="mb-4 font-mono text-data text-faded">key</p>
          <Airframe detail="key" title="Airframe key drawing" />
        </section>
      </div>
    </LazyMotion>
  );
}
