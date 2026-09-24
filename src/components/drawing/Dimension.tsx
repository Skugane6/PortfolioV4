interface DimensionProps {
  label: string;
  value: string;
  /** Where the measured extent starts and ends, as fractions of the container width. */
  from: number;
  to: number;
  className?: string;
}

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 8" className="h-2 w-[10px] shrink-0 text-faded" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M0 4 L10 0.5 L10 7.5 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A dimension line: extension ticks at both ends, arrowheads, and the value
 * breaking the line at its centre, the way a drawing dimensions an overall
 * size. Real text, so the measurement is readable to everyone.
 */
export function Dimension({ label, value, from, to, className = '' }: DimensionProps) {
  return (
    <div
      className={`absolute flex items-center ${className}`}
      style={{ left: `${from * 100}%`, width: `${(to - from) * 100}%` }}
    >
      <span aria-hidden="true" className="absolute -top-2 bottom-[-8px] left-0 w-px bg-faded/70" />
      <span aria-hidden="true" className="absolute -top-2 bottom-[-8px] right-0 w-px bg-faded/70" />
      <Arrow />
      <span aria-hidden="true" className="h-px flex-1 bg-faded/70" />
      <p className="ground mx-3 whitespace-nowrap text-label text-faded">
        <span className="lettering font-mono">{label}</span> <span className="figures text-small text-blueprint">{value}</span>
      </p>
      <span aria-hidden="true" className="h-px flex-1 bg-faded/70" />
      <Arrow flip />
    </div>
  );
}
