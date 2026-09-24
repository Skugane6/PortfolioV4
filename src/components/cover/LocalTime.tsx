import { useEffect, useState } from 'react';
import { formatZoneTime, msToNextMinute } from '../../lib/time';

/**
 * The time where Searan is, updated on each minute boundary. Renders a
 * placeholder on the server (the prerendered HTML can't know the time) and
 * stops ticking while the tab is hidden.
 */
export function LocalTime({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const date = new Date();
      setNow(date);
      timer = window.setTimeout(tick, msToNextMinute(date));
    };
    const onVisibility = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === 'visible') tick();
    };
    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [timeZone]);

  return (
    <time dateTime={now?.toISOString()} className="figures" suppressHydrationWarning>
      {now ? formatZoneTime(now, timeZone) : '--:--'}
    </time>
  );
}
