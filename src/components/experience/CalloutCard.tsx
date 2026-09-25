import { useId, useState, type CSSProperties } from 'react';
import { m, type MotionValue } from 'motion/react';
import type { Callout } from '../../content/types';

interface CalloutCardProps {
  callout: Callout;
  active: boolean;
  onActivate: (id: string | null) => void;
  /** Scroll-driven appearance (0→1). Omitted: the card is simply there. */
  appear?: { opacity: MotionValue<number>; y: MotionValue<number> };
  className?: string;
  style?: CSSProperties;
}

/**
 * One station's callout: the station tag, the title and the impact line up
 * front; the one-line summary, full existing description and tags one
 * disclosure away. Hovering or focusing it lights its station on the
 * airframe, and the active card takes the redline cutting-plane border.
 */
export function CalloutCard({ callout, active, onActivate, appear, className = '', style }: CalloutCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const titleId = `callout-${callout.id}-title`;

  const body = (
    <>
      <p className="flex flex-wrap items-baseline gap-x-3 text-label">
        <span className={`lettering font-mono ${active ? 'text-redline' : 'text-faded'}`}>STA {callout.station}</span>
        <span className="text-faded">{callout.zone}</span>
      </p>
      <h3 id={titleId} className="w-narrow mt-3 text-[20px] font-semibold leading-tight text-blueprint xl:text-heading">
        {callout.title}
      </h3>
      <p className="figures mt-4 border-l-2 border-faded/70 pl-3 text-body leading-snug text-blueprint">{callout.impact}</p>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((o) => !o)}
        className="group mt-4 inline-flex min-h-[44px] items-center gap-2 text-small text-blueprint"
      >
        <span aria-hidden="true" className="inline-block w-3 font-mono text-faded group-hover:text-redline">
          {open ? '−' : '+'}
        </span>
        <span className="link">{open ? 'Hide details' : 'Details'}</span>
      </button>
      <div id={detailsId} hidden={!open} className="mt-2">
        <p className="text-small text-faded">{callout.caption}</p>
        <p className="mt-2 text-small text-blueprint">{callout.description}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tags">
          {callout.tags.map((tag) => (
            <li
              key={tag}
              className={`border px-2 py-1 text-label ${
                callout.tagVariant === 'metric' ? 'figures border-blueprint/60 text-blueprint' : 'border-faded/60 text-faded'
              }`}
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  const shared = {
    id: `callout-${callout.id}`,
    'aria-labelledby': titleId,
    tabIndex: -1,
    onPointerEnter: () => onActivate(callout.id),
    onPointerLeave: () => onActivate(null),
    onFocus: () => onActivate(callout.id),
    className: `ground relative scroll-mt-24 border p-5 outline-offset-4 transition-colors duration-quick ${
      active ? 'border-redline [border-style:dashed] border-2 p-[19px]' : 'border-faded/60'
    } ${className}`,
  };

  if (appear) {
    return (
      <m.article {...shared} style={{ ...style, opacity: appear.opacity, y: appear.y }}>
        {body}
      </m.article>
    );
  }
  return (
    <article {...shared} style={style}>
      {body}
    </article>
  );
}
