// Shared Tailwind utility strings for motifs reused across components, kept
// here instead of duplicated inline (NavRail, Contact, and Hero all need the
// sliding-underline hover; FeaturedProject and Experience both need the
// bordered/elevated card treatment).

// Sliding underline in accent color, expanding from the left on hover/focus.
export const underlineLink =
  'relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left ' +
  'after:scale-x-0 after:bg-accent-text after:transition-transform after:duration-300 ' +
  'hover:after:scale-x-100 focus-visible:after:scale-x-100';

// Card surface: border-only elevation (depth comes from borders/flat color,
// not big shadows) that picks up a soft accent-tinted glow on hover.
export const cardSurface =
  'rounded-xl border border-border bg-surface transition-shadow duration-300 hover:shadow-card-glow';

// Faint blueprint/graph-paper grid, used behind sparse sections (Hero, Contact).
export const blueprintGrid =
  'pointer-events-none absolute inset-0 ' +
  'bg-[linear-gradient(to_right,rgba(96,128,180,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,128,180,0.07)_1px,transparent_1px)] ' +
  'bg-[size:32px_32px]';

// Stamped status/category chip: solid flat fill, white text, no gradient —
// reserved for the one deliberate use (the CraftTraq "live" badge) rather
// than scattered across every tag.
export const chipStamped =
  'inline-flex items-center rounded font-mono text-[10px] tracking-widest text-white bg-accent px-2 py-1 uppercase';

// Lighter wash chip for the skills tag list — reads as a tag, not a badge.
export const chipWash =
  'rounded font-mono text-xs tracking-wide text-accent-text bg-accent-wash px-2 py-1';

// The one true primary button on the site (résumé download in the Hero).
export const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-mono text-xs tracking-widest text-white ' +
  'uppercase transition-colors duration-150 hover:bg-accent-hover hover:shadow-accent-lift';
