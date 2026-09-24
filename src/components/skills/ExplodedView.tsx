import { useEffect, useRef, type CSSProperties } from 'react';
import { m, useMotionValue, useScroll, useTransform, type MotionValue } from 'motion/react';
import { skillGroupOrder, skillGroups } from '../../content/skills';
import type { SkillGroup } from '../../content/types';
import { itemLabel, partsByGroup } from './partsIndex';

interface ExplodedViewProps {
  group: SkillGroup | 'all';
  selected: number;
  hovered: number;
  onGroup: (g: SkillGroup) => void;
  animated: boolean;
}

// Isometric plate: 2:1 rhombus, with an edge for thickness.
const VB_W = 420;
const PLATE_W = 380;
const PLATE_D = 108;
const THICK = 8;
const LEFT = 20;
const GAP_SHUT = 14;
const GAP_OPEN = 58;

const iso = (u: number, v: number, top: number) => ({
  x: LEFT + PLATE_W / 2 + (u - v) * (PLATE_W / 2),
  y: top + (u + v) * (PLATE_D / 2),
});

/**
 * The stack as an exploded assembly: one plate per group, each carrying its
 * parts as item balloons that match the bill of materials. As the sheet
 * scrolls in the plates separate from a closed stack, which is the one
 * ambient moment on this sheet. Selecting a part marks its balloon with the
 * redline cutting plane; a plate click filters the table (a pointer
 * convenience: the filter buttons above do the same by keyboard).
 */
export function ExplodedView({ group, selected, hovered, onGroup, animated }: ExplodedViewProps) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start end', 'center center'] });
  const opening = useTransform(scrollYProgress, [0.1, 1], [GAP_SHUT, GAP_OPEN], { clamp: true });
  const open = useMotionValue(GAP_OPEN);
  const gap = animated ? opening : open;

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const measure = () => svg.style.setProperty('--u', String(VB_W / Math.max(1, svg.getBoundingClientRect().width)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);

  const height = 44 + skillGroupOrder.length * (PLATE_D + THICK) + (skillGroupOrder.length - 1) * GAP_OPEN + 20;

  return (
    <div ref={wrapRef}>
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${height}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Exploded view of the stack: four plates, build surface on top, then integrations, data and models, and quality and delivery, each carrying its numbered parts."
      style={{ ['--u' as string]: 1 } as CSSProperties}
    >
      {skillGroupOrder.map((g, gi) => (
        <Plate
          key={g}
          group={g}
          index={gi}
          gap={gap}
          dim={group !== 'all' && group !== g}
          selected={selected}
          hovered={hovered}
          onGroup={onGroup}
        />
      ))}
    </svg>
    </div>
  );
}

interface PlateProps {
  group: SkillGroup;
  index: number;
  gap: MotionValue<number>;
  dim: boolean;
  selected: number;
  hovered: number;
  onGroup: (g: SkillGroup) => void;
}

function Plate({ group, index, gap, dim, selected, hovered, onGroup }: PlateProps) {
  const openY = 36 + index * (PLATE_D + THICK + GAP_OPEN);
  const y = useTransform(gap, (g: number) => 36 + index * (PLATE_D + THICK + g) - openY);
  const parts = partsByGroup[group];
  const top = openY;
  const n = iso(0, 0, top);
  const e = iso(1, 0, top);
  const s = iso(1, 1, top);
  const w = iso(0, 1, top);
  const face = `M${n.x} ${n.y} L${e.x} ${e.y} L${s.x} ${s.y} L${w.x} ${w.y} Z`;
  const edge = `M${w.x} ${w.y} L${s.x} ${s.y} L${e.x} ${e.y} L${e.x} ${e.y + THICK} L${s.x} ${s.y + THICK} L${w.x} ${w.y + THICK} Z`;

  // Balloons in up to two rows across the plate.
  const perRow = Math.ceil(parts.length / 2);
  const balloons = parts.map((p, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const u = 0.14 + (col / Math.max(1, perRow - 1)) * 0.72;
    const v = row === 0 ? 0.3 : 0.7;
    return { part: p, ...iso(u, v, top) };
  });

  return (
    // Pointer convenience only; the filter buttons above the table are the
    // keyboard route to the same action.
    <m.g
      style={{ y }}
      onClick={() => onGroup(group)}
      className={`cursor-pointer transition-opacity duration-base ${dim ? 'opacity-35' : 'opacity-100'}`}
    >
      <path d={edge} fill="rgb(var(--c-cyanotype))" stroke="rgb(var(--c-faded))" style={{ strokeWidth: 'calc(var(--u) * 1px)' }} />
      <path d={face} fill="rgb(var(--c-cyanotype))" stroke="rgb(var(--c-blueprint))" strokeLinejoin="round" style={{ strokeWidth: 'calc(var(--u) * 2px)' }} />
      {/* Above the plate's left half, which is open space at every separation. */}
      <text x={w.x} y={top - 10} className="fill-faded" style={{ fontSize: 'calc(var(--u) * 13px)' }}>
        {skillGroups[group].label}
      </text>
      {balloons.map(({ part, x, y: by }) => {
        const on = part.item === selected;
        const hot = part.item === hovered;
        return (
          <g key={part.item}>
            <circle
              cx={x}
              cy={by}
              fill={on ? 'rgb(var(--c-redline))' : 'rgb(var(--c-cyanotype))'}
              stroke={on || hot ? 'rgb(var(--c-redline))' : 'rgb(var(--c-faded))'}
              style={{ r: 'calc(var(--u) * 13px)', strokeWidth: 'calc(var(--u) * 1.5px)' } as CSSProperties}
            />
            <text
              x={x}
              y={by}
              dy="0.35em"
              textAnchor="middle"
              className={`font-mono ${on ? 'fill-cyanotype' : 'fill-blueprint'}`}
              style={{ fontSize: 'calc(var(--u) * 13px)' }}
            >
              {itemLabel(part.item)}
            </text>
          </g>
        );
      })}
    </m.g>
  );
}
