import type { ReactNode } from 'react';

interface StampProps {
  /** Lines of lettering, top to bottom. The first is set largest. */
  lines: ReactNode[];
  className?: string;
  /** Degrees; a hand-applied stamp is never square to the sheet. */
  tilt?: number;
}

/**
 * An inspection stamp in redline: double ruled border, drawing lettering.
 * Rendered as text (not an image) so its words are read out.
 */
export function Stamp({ lines, className = '', tilt = -6 }: StampProps) {
  const [first, ...rest] = lines;
  return (
    <div
      className={`inline-block border-2 border-redline p-[3px] text-redline ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="border border-redline px-3 py-2 text-center">
        <p className="lettering w-semi text-small font-bold leading-tight">{first}</p>
        {rest.map((line, i) => (
          <p key={i} className="lettering mt-0.5 font-mono text-label">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
