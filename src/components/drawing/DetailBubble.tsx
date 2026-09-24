interface DetailBubbleProps {
  /** Detail or item identifier, printed above the rule. */
  id: string;
  /** Sheet the detail is drawn on, printed below the rule. Omit for a plain balloon. */
  sheet?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A detail-reference bubble: a circle split by a rule, the detail above, the
 * sheet it is drawn on below. On a drawing it says "this is shown enlarged on
 * sheet 02"; here it marks a link that leads to the proof. Decorative: the
 * link around it carries the accessible name.
 */
export function DetailBubble({ id, sheet, size = 'md', className = '' }: DetailBubbleProps) {
  const box = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 flex-col items-center justify-center rounded-full border border-current font-mono leading-none ${box} ${className}`}
    >
      {sheet ? (
        <>
          <span className="text-label">{id}</span>
          <span className="my-[3px] h-px w-full bg-current opacity-80" />
          <span className="text-label">{sheet}</span>
        </>
      ) : (
        <span className="text-data">{id}</span>
      )}
    </span>
  );
}
