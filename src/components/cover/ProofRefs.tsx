import { pad2 } from '../../content/sheets';
import type { ProofRef } from '../../content/types';
import { DetailBubble } from '../drawing/DetailBubble';

const LETTERS = 'ABCDEFGH';

/**
 * The cover's proof items, each a reference to the sheet that proves it:
 * detail letter over sheet number, the way a drawing points to an enlarged
 * detail. An item with nothing on the page to point at is printed as a plain
 * figure rather than a link that wouldn't prove it.
 */
export function ProofRefs({ items, firstLetter = 0 }: { items: ProofRef[]; firstLetter?: number }) {
  let letter = firstLetter;
  return (
    <ul className="grid grid-cols-2 border-l border-t border-faded/50 lg:grid-cols-4">
      {items.map((item) => {
        const body = (
          <>
            <span className="flex items-start justify-between gap-3">
              {item.mark ? (
                <img
                  src={item.mark.src}
                  srcSet={item.mark.srcSet}
                  sizes="128px"
                  alt={item.mark.alt}
                  width={item.mark.width}
                  height={item.mark.height}
                  className="h-[26px] w-auto sm:h-[30px]"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="w-cond text-data-lg font-bold tabular-nums text-blueprint">{item.figure}</span>
              )}
              {item.target && item.sheet !== null ? (
                <DetailBubble id={LETTERS[letter++]} sheet={pad2(item.sheet)} size="sm" className="text-faded group-hover:text-redline" />
              ) : null}
            </span>
            <span className="mt-3 block text-small text-faded group-hover:text-blueprint">
              {item.mark ? `${item.label}, ${item.figure}` : item.label}
            </span>
          </>
        );
        return (
          <li key={item.id} className="ground border-b border-r border-faded/50">
            {item.target ? (
              <a
                href={item.target}
                className="group block h-full p-4 transition-colors duration-quick hover:bg-blueprint/[0.04] sm:p-5"
              >
                {body}
                <span className="sr-only">, see sheet {pad2(item.sheet ?? 0)}</span>
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
