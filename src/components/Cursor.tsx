import { useEffect, useRef, useState } from 'react';

// Diameter of the soft light itself, and of the square that carries the
// revealed grid. The grid window is much the smaller of the two, so its lines
// fade out well inside the glow rather than ending on an edge of their own —
// and so the pattern stays a tight pool under the pointer instead of washing
// across half a section.
const GLOW = 360;
const GRID = 240;

// Matches the hero's own minor grid, so passing the light across the hero
// reads as that drawing coming up brighter rather than a second grid laid
// over it.
const CELL = 40;

// What makes the light bloom. Not a lock and not a snap — the light never
// leaves the pointer, it only opens up over something worth clicking.
const INTERACTIVE = 'a, button, [role="button"], summary';

// Raster surfaces the grid must not be drawn across. A screenshot with
// blueprint lines ruled over it reads as a rendering fault, not as an effect,
// so the pattern drops away over these and only the light stays — dimmed,
// because `screen` over a bright photograph washes it out.
//
// Inline <svg> is deliberately absent: the hero's connectors and the social
// glyphs are drawn chrome on a transparent ground, and the grid crossing
// those is the effect working, not failing.
const MEDIA = 'img, picture, video, canvas';

const SCALE = { idle: 1, hover: 1.22, press: 0.9 };

/**
 * A torch that travels with the native cursor: a soft pool of light, and
 * inside it a window onto blueprint grid that is not otherwise drawn. The
 * page reads as a technical drawing being examined under a lamp.
 *
 * The light sits exactly on the pointer — nothing eases its position, so it
 * never trails the arrow. Only its size responds, blooming over links and
 * pressing in on click.
 *
 * Everything is written straight to the node as CSS custom properties, the
 * way useStageTilt writes --mx/--my: this runs on every pointer event, and a
 * component re-rendering React at 120Hz would be the one thing that made it
 * stutter. Position is a transform on the outer node and scale a transform on
 * the inner one, so the two can never overwrite each other and the scale can
 * carry a transition while the position stays instant.
 */
export function Cursor() {
  // `(pointer: fine)` is the gate, not screen width: there is no pointer to
  // light the way for on a touch device, so this renders nothing at all.
  const [fine, setFine] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia?.('(pointer: fine)');
    if (!query) return;
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!fine) return;
    const layer = layerRef.current;
    if (!layer) return;

    let hovering = false;
    let pressing = false;
    let overMedia = false;

    const applyScale = () => {
      const scale = pressing ? SCALE.press : hovering ? SCALE.hover : SCALE.idle;
      layer.style.setProperty('--torch-scale', String(scale));
    };

    const handleMove = (event: PointerEvent) => {
      layer.style.setProperty('--torch-x', `${event.clientX}px`);
      layer.style.setProperty('--torch-y', `${event.clientY}px`);
      layer.style.opacity = '1';
    };

    const handleOver = (event: PointerEvent) => {
      const element = event.target instanceof Element ? event.target : null;

      const over = Boolean(element?.closest(INTERACTIVE));
      if (over !== hovering) {
        hovering = over;
        applyScale();
      }

      const media = Boolean(element?.closest(MEDIA));
      if (media !== overMedia) {
        overMedia = media;
        layer.style.setProperty('--torch-grid', media ? '0' : '1');
        layer.style.setProperty('--torch-glow', media ? '.45' : '1');
      }
    };

    const handleDown = () => {
      pressing = true;
      applyScale();
    };

    const handleUp = () => {
      pressing = false;
      applyScale();
    };

    // Without this the light is left stranded against the edge of the window
    // after the pointer has gone somewhere else entirely.
    const handleLeave = () => {
      layer.style.opacity = '0';
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerover', handleOver, { passive: true });
    window.addEventListener('pointerdown', handleDown, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
    document.addEventListener('pointerleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerover', handleOver);
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointerleave', handleLeave);
    };
  }, [fine]);

  if (!fine) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      // overflow-hidden so the light sitting near an edge cannot widen the
      // document behind it.
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden transition-opacity duration-300"
      style={{ opacity: 0 }}
    >
      <div
        className="absolute left-0 top-0"
        // Position only, and never transitioned: this is what keeps the light
        // welded to the arrow instead of swimming after it.
        style={{ transform: 'translate3d(var(--torch-x, -50vw), var(--torch-y, -50vh), 0)' }}
      >
        <div
          className="relative motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
          style={{ transform: 'scale(var(--torch-scale, 1))' }}
        >
          {/* The lamp. `screen` means it can only ever add light — it lifts the
              near-black ground and leaves type where it is, whereas a plain
              translucent fill would have veiled everything it crossed. */}
          <div
            className="absolute"
            style={{
              width: GLOW,
              height: GLOW,
              left: -GLOW / 2,
              top: -GLOW / 2,
              background:
                'radial-gradient(closest-side, rgba(56,118,230,.22), rgba(56,118,230,.07) 55%, rgba(56,118,230,0) 78%)',
              mixBlendMode: 'screen',
              opacity: 'var(--torch-glow, 1)',
              transition: 'opacity .25s ease',
            }}
          />

          {/* Grid that exists only where the light falls. Its background
              position is pulled back by the pointer's own offset, which pins
              the pattern to the viewport — without that the grid would ride
              along inside the moving window and its lines would never line up
              with the hero's. Masked to a circle so it has no edge either. */}
          <div
            className="absolute"
            style={{
              width: GRID,
              height: GRID,
              left: -GRID / 2,
              top: -GRID / 2,
              backgroundImage:
                'linear-gradient(rgba(126,176,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(126,176,255,.4) 1px, transparent 1px)',
              backgroundSize: `${CELL}px ${CELL}px`,
              backgroundPosition: `calc(${GRID / 2}px - var(--torch-x, 0px)) calc(${GRID / 2}px - var(--torch-y, 0px))`,
              WebkitMaskImage: 'radial-gradient(closest-side, #000 12%, transparent 72%)',
              maskImage: 'radial-gradient(closest-side, #000 12%, transparent 72%)',
              mixBlendMode: 'screen',
              opacity: 'var(--torch-grid, 1)',
              transition: 'opacity .25s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}
