import { useRef, useState } from 'react';
import { pad2, sheetById, sheets } from '../../content/sheets';
import type { SheetId } from '../../content/types';
import { useReducedMotionPref } from '../../lib/motion';
import { goToSheet, useActiveSheet } from '../../lib/useActiveSheet';

const IDS = sheets.map((s) => s.id);

/**
 * Below 1024px the sheet index folds into a strip at the foot of the screen,
 * the way a title block sits at the foot of a sheet: the current sheet on the
 * left, the full index one tap away on the right. 52px tall, clear of the
 * home indicator, and nothing in it is under 13px.
 */
export function TitleStrip({ onOpenIndex }: { onOpenIndex?: () => void }) {
  const active = useActiveSheet(IDS) as SheetId;
  const sheet = sheetById[active];
  const reduced = useReducedMotionPref();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openIndex = () => {
    if (onOpenIndex) return onOpenIndex();
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const close = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t-2 border-construction bg-cyanotype lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <p className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <span className="font-mono text-data text-faded">
            {pad2(sheet.number)}/{pad2(sheets.length)}
          </span>
          <span className="truncate text-small text-blueprint">{sheet.title}</span>
        </p>
        <button
          type="button"
          onClick={openIndex}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex h-[52px] items-center gap-2 border-l border-construction px-5 text-small text-blueprint"
        >
          Index
        </button>
      </div>

      {!onOpenIndex && (
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          aria-label="Sheet index"
          className="m-0 mt-auto w-full max-w-none border-t-2 border-construction bg-cyanotype p-0 text-blueprint backdrop:bg-cyanotype/70 lg:hidden"
        >
          <nav aria-label="Sheet index">
            <ol>
              {sheets.map((s) => (
                <li key={s.id} className="border-b border-construction/60">
                  <a
                    href={`#${s.id}`}
                    aria-current={s.id === active ? 'location' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      close();
                      goToSheet(s.id, reduced);
                    }}
                    className="flex items-center gap-4 px-4 py-4"
                  >
                    <span className={`font-mono text-data ${s.id === active ? 'text-redline' : 'text-faded'}`}>{pad2(s.number)}</span>
                    <span className="text-body">{s.title}</span>
                    <span className="ml-auto text-small text-faded">{s.drawingTitle}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <button type="button" onClick={close} className="w-full px-4 py-4 text-left text-small text-faded">
            Close
          </button>
        </dialog>
      )}
    </>
  );
}
