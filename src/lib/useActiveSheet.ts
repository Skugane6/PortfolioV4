import { useEffect, useState } from 'react';

// The middle 20% of the viewport is the band a reader's eye sits on; the
// sheet whose top is highest inside it is the one being read.
const BAND = '-40% 0px -40% 0px';

/**
 * Which sheet is being read. IntersectionObserver reports only changes, so
 * the set of sheets inside the band is carried across callbacks rather than
 * derived from one batch (a sheet entering while the one above is still in
 * the band would otherwise never win). At the very bottom of the page the
 * last sheet wins even if it is too short to reach the band.
 */
export function useActiveSheet(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');

  useEffect(() => {
    const list = key.split('|');
    const inBand = new Map<string, number>();
    const pick = () => {
      if (inBand.size === 0) return;
      let top = Infinity;
      let id = list[0];
      for (const [k, y] of inBand) if (y < top) [top, id] = [y, k];
      setActive(id);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.set(e.target.id, e.boundingClientRect.top);
          else inBand.delete(e.target.id);
        }
        pick();
      },
      { rootMargin: BAND, threshold: 0 },
    );
    list.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    const onScroll = () => {
      const doc = document.documentElement;
      if (doc.scrollHeight > innerHeight + 1 && innerHeight + scrollY >= doc.scrollHeight - 2) setActive(list[list.length - 1]);
      else if (scrollY < 8) setActive(list[0]);
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      removeEventListener('scroll', onScroll);
    };
  }, [key]);

  return active;
}

/**
 * Scrolls to a sheet without the browser's hash jump (so the URL keeps one
 * history entry) and moves focus to its heading, so a keyboard or screen
 * reader user lands where the eye does.
 */
export function goToSheet(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  history.replaceState(null, '', id === 'cover' ? location.pathname + location.search : `#${id}`);
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const heading = el.querySelector<HTMLElement>('h1, h2');
  if (heading) {
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
