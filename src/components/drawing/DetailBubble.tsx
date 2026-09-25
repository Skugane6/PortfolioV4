interface DetailBubbleProps {
  /** Detail or item identifier, printed above the rule. */
  id: string;
  /** Sheet the detail is drawn on, printed below the rule. Omit for a plain balloon. */
  sheet?: string;
  className?: string;
}

/**
 * A detail-reference bubble: a circle split by a rule, the detail above, the
 * sheet it is drawn on below. On a drawing it says "this is shown enlarged on
 * sheet 02"; here it marks a link that leads to the proof. Decorative: the
 * link around it carries the accessible name.
 */
export function DetailBubble({ id, sheet, className = '' }: DetailBubbleProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 flex-col items-center justify-center h-12 w-12 rounded-full border border-current font-mono leading-none ${className}`}
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
