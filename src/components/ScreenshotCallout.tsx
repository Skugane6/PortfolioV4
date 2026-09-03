interface ScreenshotCalloutProps {
  label: string;
  top: string;
  left: string;
}

export function ScreenshotCallout({ label, top, left }: ScreenshotCalloutProps) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-sm border border-accent/40 bg-void/80 px-2 py-1 font-mono text-[10px] tracking-widest text-accent-text"
      style={{ top, left }}
    >
      {label}
    </span>
  );
}
