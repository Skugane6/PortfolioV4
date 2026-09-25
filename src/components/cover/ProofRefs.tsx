import { pad2 } from '../../content/sheets';
import type { ProofRef } from '../../content/types';
import { DetailBubble } from '../drawing/DetailBubble';

/**
 * The cover's proof items, each a reference to the thing that proves it: the
 * target's own label (station, figure or note number) over its sheet number,
 * the way a drawing points to a detail. An item with nothing on the page to
 * point at is printed as a plain figure rather than a link that wouldn't
 * prove it.
 */
export function ProofRefs({ items }: { items: ProofRef[] }) {
  return (
    <ul className="grid border-l border-t border-faded/50 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const body = (
          <>
            {/* Tall enough for a bubble in every cell, so the labels line up. */}
            <span className="flex min-h-12 items-start justify-between gap-3">
              {item.mark ? (
                <img
                  src={item.mark.src}
                  srcSet={item.mark.srcSet}
                  sizes="128px"
                  alt={item.mark.alt}
                  width={item.mark.width}
                  height={item.mark.height}
                  className="h-[26px] w-auto sm:h-[30px] lg:h-[22px] xl:h-[30px]"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="w-cond text-data-lg font-bold tabular-nums text-blueprint">{item.figure}</span>
              )}
              {item.target && (
                <DetailBubble id={item.target.ref} sheet={pad2(item.target.sheet)} className="text-faded group-hover:text-redline" />
              )}
            </span>
            <span className="mt-3 block text-balance text-small text-faded group-hover:text-blueprint">
              {item.mark ? `${item.label}, ${item.figure}` : item.label}
            </span>
          </>
        );
        return (
          <li key={item.id} className="ground border-b border-r border-faded/50">
            {item.target ? (
              <a
                href={item.target.href}
                className="group block h-full p-4 transition-colors duration-quick hover:bg-blueprint/[0.04] sm:p-5"
              >
                {body}
                <span className="sr-only">
                  , see {item.target.name} on sheet {pad2(item.target.sheet)}
                </span>
              </a>
            ) : (
              <div className="h-full p-4 sm:p-5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
