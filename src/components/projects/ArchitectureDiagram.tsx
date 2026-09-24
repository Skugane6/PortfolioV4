import { useEffect, useMemo, useRef, useState } from 'react';
import type { CaseStudy } from '../../content/types';
import { layoutArchitecture } from './architecture';

/**
 * A block diagram in the drawing's own conventions: boxes are object lines,
 * connections are thin leaders ending in arrowheads, the product boundary is
 * a hidden (dashed) line. Drawn at true size when it fits, scaled to fit when
 * the dialog is a little narrower, and replaced by a list below that, where
 * scaling would push its lettering under 13px. The list is also what screen
 * readers get at every size.
 */
export function ArchitectureDiagram({ architecture }: { architecture: CaseStudy['architecture'] }) {
  const layout = useMemo(() => layoutArchitecture(architecture.nodes, architecture.edges), [architecture]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / layout.width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.width]);

  // 15px labels at 0.87 are 13px: below that the list is the better drawing.
  const drawable = scale !== null && scale >= 0.87;
  const byId = new Map(architecture.nodes.map((n) => [n.id, n]));
  const describe = (id: string) => (id === 'boundary' ? 'the product' : byId.get(id)?.label ?? id);

  return (
    <figure>
      <div ref={wrapRef} className="w-full">
        {drawable && (
          <div
            aria-hidden="true"
            className="relative origin-top-left"
            style={{ width: layout.width, height: layout.height, transform: `scale(${scale})`, marginBottom: layout.height * (scale - 1) }}
          >
            <svg className="absolute inset-0 overflow-visible" width={layout.width} height={layout.height}>
              <defs>
                <marker id="arch-arrow" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="10" markerHeight="8" orient="auto-start-reverse">
                  <path d="M0 0.5 L10 4 L0 7.5 Z" fill="rgb(var(--c-faded))" />
                </marker>
              </defs>
              {layout.boundary && (
                <rect
                  x={layout.boundary.x}
                  y={layout.boundary.y}
                  width={layout.boundary.w}
                  height={layout.boundary.h}
                  fill="none"
                  stroke="rgb(var(--c-construction))"
                  strokeWidth={1}
                  strokeDasharray="6 4"
                />
              )}
              {layout.routes.map((r) => (
                <polyline
                  key={`${r.from}-${r.to}`}
                  points={r.points.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke="rgb(var(--c-faded))"
                  strokeWidth={1}
                  markerEnd="url(#arch-arrow)"
                />
              ))}
            </svg>
            {layout.boundary && (
              <span
                className="lettering ground absolute px-1 font-mono text-label text-faded"
                style={{ left: layout.boundary.x + 12, top: layout.boundary.y + layout.boundary.h - 9 }}
              >
                Product boundary
              </span>
            )}
            {layout.nodes.map((n) => (
              <div
                key={n.id}
                className={`ground absolute flex flex-col justify-center px-3 ${n.inside ? 'border-2 border-blueprint' : 'border border-faded/70'}`}
                style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
              >
                <span className="w-narrow text-small font-semibold leading-tight text-blueprint">{n.label}</span>
                {n.detail && <span className="mt-0.5 text-label leading-tight text-faded">{n.detail}</span>}
              </div>
            ))}
            {layout.routes
              .filter((r) => r.label)
              .map((r) => {
                const [a, b] = [r.points[0], r.points[r.points.length - 1]];
                return (
                  <span
                    key={`label-${r.from}`}
                    className="ground absolute -translate-y-1/2 px-1 text-label text-faded"
                    style={{ left: Math.min(a[0], b[0]) + 8, top: (a[1] + b[1]) / 2 }}
                  >
                    {r.label}
                  </span>
                );
              })}
          </div>
        )}

        <div className={drawable ? 'sr-only' : undefined}>
          <h4 className="lettering text-label text-faded">Inside the product</h4>
          <ul className="mt-2 space-y-2">
            {architecture.nodes
              .filter((n) => n.inside)
              .map((n) => (
                <li key={n.id} className="border-l-2 border-blueprint pl-3 text-small">
                  <span className="text-blueprint">{n.label}</span>
                  {n.detail && <span className="text-faded">: {n.detail}</span>}
                </li>
              ))}
          </ul>
          {architecture.nodes.some((n) => !n.inside) && (
            <>
              <h4 className="lettering mt-4 text-label text-faded">Connected services</h4>
              <ul className="mt-2 space-y-2">
                {architecture.nodes
                  .filter((n) => !n.inside)
                  .map((n) => (
                    <li key={n.id} className="border-l border-faded/70 pl-3 text-small">
                      <span className="text-blueprint">{n.label}</span>
                      {n.detail && <span className="text-faded">: {n.detail}</span>}
                    </li>
                  ))}
              </ul>
            </>
          )}
          <h4 className="lettering mt-4 text-label text-faded">Connections</h4>
          <ul className="mt-2 space-y-1 text-small text-faded">
            {architecture.edges.map((e) => (
              <li key={`${e.from}-${e.to}`}>
                {describe(e.from)} <span aria-hidden="true">→</span>
                <span className="sr-only">to</span> {describe(e.to)}
                {e.label ? `: ${e.label}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-4 text-label text-faded">{architecture.caption}</figcaption>
    </figure>
  );
}
