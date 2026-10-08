import type { DemoKind } from '../../content/types';

/**
 * Small line drawings of what each project does, for the figure cards. They
 * carry no numbers, so nothing here can be mistaken for a result; the real
 * interactive versions are inside each detail sheet.
 */
export function FigureSketch({ kind }: { kind: DemoKind }) {
  if (kind === 'risk') return <RiskSketch />;
  return <TextSketch />;
}

const common = {
  fill: 'none',
  vectorEffect: 'non-scaling-stroke' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function RiskSketch() {
  // A deterministic scatter under a frontier-shaped curve.
  const dots = Array.from({ length: 70 }, (_, i) => {
    const t = ((i * 37) % 97) / 97;
    const u = ((i * 61) % 89) / 89;
    const x = 40 + t * 200;
    const top = 150 - Math.sqrt(Math.max(0, x - 40)) * 8.6;
    return { x, y: top + 8 + u * (160 - top) };
  });
  return (
    <svg viewBox="0 0 280 180" className="h-full w-full" aria-hidden="true">
      <path d="M30 10 V165 H270" stroke="rgb(var(--c-faded))" strokeWidth={1} {...common} />
      {[60, 100, 140].map((y) => (
        <path key={y} d={`M30 ${y} H270`} stroke="rgb(var(--c-construction) / 0.4)" strokeWidth={1} {...common} />
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.6} fill="rgb(var(--c-construction))" />
      ))}
      <path
        d={`M40 150 ${Array.from({ length: 21 }, (_, i) => {
          const x = 40 + i * 10;
          return `L${x} ${150 - Math.sqrt(x - 40) * 8.6}`;
        }).join(' ')}`}
        stroke="rgb(var(--c-blueprint))"
        strokeWidth={2}
        {...common}
      />
      <path d="M122 72 V165 M30 72 H122" stroke="rgb(var(--c-redline))" strokeWidth={1} strokeDasharray="5 4" {...common} />
      <circle cx={122} cy={72} r={5} fill="rgb(var(--c-redline))" />
    </svg>
  );
}

function TextSketch() {
  const stages = [28, 78, 128, 178, 228];
  return (
    <svg viewBox="0 0 280 180" className="h-full w-full" aria-hidden="true">
      {stages.map((x, i) => (
        <g key={x}>
          <rect x={x - 18} y={i === 3 ? 56 : 74} width={36} height={32} stroke="rgb(var(--c-blueprint))" strokeWidth={i === 2 ? 2 : 1.2} {...common} />
          {i === 3 && <rect x={x - 18} y={100} width={36} height={32} stroke="rgb(var(--c-blueprint))" strokeWidth={1.2} {...common} />}
          {i < stages.length - 1 && (
            <path d={`M${x + 18} 90 H${stages[i + 1] - 18}`} stroke="rgb(var(--c-faded))" strokeWidth={1} {...common} />
          )}
        </g>
      ))}
      {/* Token ticks in the first box, a label bar in the last. */}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${16 + i * 7} 84 V96`} stroke="rgb(var(--c-faded))" strokeWidth={1} {...common} />
      ))}
      <path d="M217 90 H239" stroke="rgb(var(--c-redline))" strokeWidth={3} {...common} />
      <path d="M140 40 H216 M140 40 V56" stroke="rgb(var(--c-construction))" strokeWidth={1} strokeDasharray="5 4" {...common} />
    </svg>
  );
}
