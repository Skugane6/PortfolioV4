import { useEffect, useRef, type MouseEvent } from 'react';
import { pad2, sheets } from '../../content/sheets';
import { useReducedMotionPref } from '../../lib/motion';
import { goToSheet, useActiveSheet } from '../../lib/useActiveSheet';

const IDS = sheets.map((s) => s.id);

/**
 * The sheet index, fixed in the right margin from 1024px. Numbers sit in
 * reference bubbles on a centre line; the current sheet's bubble is marked
 * in redline, and a redline segment runs down the line as the sheet is read.
 * The page reserves the rail's width (--rail-w), so it never covers content.
 */
export function SheetIndex() {
  const active = useActiveSheet(IDS);
  const reduced = useReducedMotionPref();
  const progressRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  // Progress through the current sheet, written straight to the segment's
  // transform: no React render per scroll frame.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const seg = progressRef.current;
      const list = listRef.current;
      const sheet = document.getElementById(active);
      if (!seg || !list || !sheet) return;
      const index = IDS.indexOf(active as (typeof IDS)[number]);
      const items = list.querySelectorAll<HTMLElement>('[data-bubble]');
      const from = items[index];
      const to = items[index + 1];
      const r = sheet.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      if (!from || !to) {
        seg.style.transform = 'scaleY(0)';
        return;
      }
      const top = from.offsetTop + from.offsetHeight;
      const len = to.offsetTop - top;
      seg.style.top = `${top}px`;
      seg.style.height = `${len}px`;
      seg.style.transform = `scaleY(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, [active]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    goToSheet(id, reduced);
  };

  return (
    <nav
      aria-label="Sheet index"
      className="fixed right-[var(--frame-inset)] top-1/2 z-30 hidden w-[calc(var(--rail-w)-12px)] -translate-y-1/2 lg:block"
    >
      <ol ref={listRef} className="relative flex flex-col items-start gap-5 xl:gap-4">
        {/* Centre line through the bubbles, and the redline progress segment. */}
        <span aria-hidden="true" className="absolute bottom-4 left-[17px] top-4 w-0 border-l border-dashed border-construction" />
        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute left-[16.5px] w-[2px] origin-top bg-redline"
          style={{ transform: 'scaleY(0)' }}
        />
        {sheets.map((sheet) => {
          const current = sheet.id === active;
          return (
            <li key={sheet.id} className="relative">
              <a
                href={`#${sheet.id}`}
                onClick={(e) => onClick(e, sheet.id)}
                aria-current={current ? 'location' : undefined}
                className="group flex items-center gap-3 py-1 outline-offset-4"
              >
                <span
                  data-bubble
                  className={`relative z-10 flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full border bg-cyanotype font-mono text-data transition-colors duration-quick ${
                    current ? 'border-2 border-redline text-redline' : 'border-faded/70 text-faded group-hover:border-blueprint group-hover:text-blueprint'
                  }`}
                >
                  {pad2(sheet.number)}
                </span>
                {/* Always visible from 1280px; between 1024 and 1279 the rail
                    is bubbles only, and the name appears on hover or focus. */}
                <span
                  className={`whitespace-nowrap text-small transition-colors duration-quick xl:static xl:block xl:bg-transparent xl:p-0 ${
                    current ? 'text-blueprint' : 'text-faded group-hover:text-blueprint'
                  } absolute right-[calc(100%+8px)] hidden border border-faded/70 bg-cyanotype px-2 py-1 group-hover:block group-focus-visible:block xl:border-0`}
                >
                  {sheet.title}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
