import { useRef } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import type { Screen } from '../../content/types';

interface DeviceFramesProps {
  screens: Screen[];
  /** Scroll-linked depth between the two frames. Off under reduced motion. */
  animated: boolean;
  /** Load eagerly (inside the detail sheet) or lazily (on the page). */
  eager?: boolean;
  url?: string;
}

/**
 * CraftTraq's real screens in drawn device frames: the job board in a
 * browser frame, the calendar in a phone frame set in front of it. The phone
 * rides a little faster than the page, so the two read as separate objects.
 */
export function DeviceFrames({ screens, animated, eager = false, url }: DeviceFramesProps) {
  const desktop = screens.find((s) => s.kind === 'desktop');
  const phone = screens.find((s) => s.kind === 'phone');
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <div ref={ref} className="relative pb-10 pr-10 sm:pb-14 sm:pr-16">
      {desktop && (
        <div className="border-2 border-blueprint bg-cyanotype">
          <div className="flex h-8 items-center gap-3 border-b border-faded/60 px-3">
            {url && <span className="truncate text-label text-faded">{url}</span>}
          </div>
          <picture>
            <source srcSet={desktop.srcSet} sizes={eager ? "(min-width: 1120px) 1000px, 92vw" : "(min-width: 1024px) 40vw, 92vw"} type="image/webp" />
            <img
              src={desktop.png}
              alt={desktop.alt}
              width={desktop.width}
              height={desktop.height}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="block h-auto w-full"
            />
          </picture>
        </div>
      )}
      {phone && (
        <m.div
          className="absolute bottom-0 right-0 w-[26%] min-w-[96px] max-w-[190px] rounded-device border-2 border-blueprint bg-cyanotype p-[5px]"
          style={animated ? { y: phoneY } : undefined}
        >
          <picture>
            <source srcSet={phone.srcSet} sizes="190px" type="image/webp" />
            <img
              src={phone.png}
              alt={phone.alt}
              width={phone.width}
              height={phone.height}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="block h-auto w-full rounded-[22px]"
            />
          </picture>
        </m.div>
      )}
    </div>
  );
}
