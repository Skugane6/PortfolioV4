/** The checker's mark: a paw print in redline, the cat's signature on the set. */
export function PawMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={`text-redline ${className}`}>
      <g fill="currentColor" transform="rotate(-12 20 20)">
        <ellipse cx="20" cy="26" rx="8.5" ry="7" />
        <ellipse cx="9.5" cy="16.5" rx="3.6" ry="4.6" />
        <ellipse cx="16" cy="10.5" rx="3.6" ry="4.8" />
        <ellipse cx="24" cy="10.5" rx="3.6" ry="4.8" />
        <ellipse cx="30.5" cy="16.5" rx="3.6" ry="4.6" />
      </g>
    </svg>
  );
}
