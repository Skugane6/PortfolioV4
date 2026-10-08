import { useEffect, useState } from 'react';

// Fraction of the viewport, top and bottom, excluded from the "active" band.
// What is left is the middle 20%, the strip a reader's eye actually sits on.
const BAND_MARGIN = '-40% 0px -40% 0px';

export function useActiveSection(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0]);

  // Callers build this list inline (`SECTIONS.map(s => s.id)`), so depending on
  // the array itself would give the effect a new identity every render and
  // rebuild the observer constantly. Depend on a primitive instead.
  const key = sectionIds.join('|');

  useEffect(() => {
    const ids = key.split('|');

    // Viewport-relative top of every section currently inside the band, carried
    // across callbacks. IntersectionObserver only reports entries whose state
    // *changed* in that tick, so a section that is still in the band is simply
    // absent from later batches. Deriving the answer from `entries` alone means
    // a section that enters while the one above it is still in the band can
    // never win: it loses the batch it arrived in (the section above is
    // topmost), and the section above then leaves in an exit-only batch that
    // contains no intersecting entry at all. That stranded both Projects and
// Contact: neither could be highlighted by scrolling.
    const band = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            band.set(id, entry.boundingClientRect.top);
          } else {
            band.delete(id);
          }
        }

        // Nothing in the band (mid-handoff, or a section taller than the band
        // scrolling past its own edges): keep the last answer rather than
        // blanking the rail.
        if (band.size === 0) return;

        let topId = ids[0];
        let topY = Infinity;
        for (const [id, top] of band) {
          if (top < topY) {
            topY = top;
            topId = id;
          }
        }
        setActiveId(topId);
      },
      { rootMargin: BAND_MARGIN, threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // The last section is shorter than the gap the band leaves at the end of
    // the document, so scrolling to the very bottom leaves it only a sliver of
    // travel in which it is topmost. Once you cannot scroll any further, the
    // final section is what you are looking at, so say so.
    const lastId = ids[ids.length - 1];
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight > window.innerHeight + 1;
      if (scrollable && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        setActiveId(lastId);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [key]);

  return activeId;
}
