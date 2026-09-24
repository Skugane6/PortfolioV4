/**
 * The six drafting materials the whole site is drawn in (DESIGN.md §4.1).
 * tokens.css carries the same values as CSS custom properties; this module is
 * the copy the contrast test and canvas/SVG code read.
 */
export const palette = {
  /** Prussian-blue cyanotype print: the page ground. */
  cyanotype: '#0f2a4c',
  /** White paper showing through where lines were drawn: text, object lines. */
  blueprint: '#eef3fa',
  /** Faded linework: secondary text, labels, thin lines. */
  faded: '#a9c1e0',
  /** Construction lines. Graphics only, never text (3.9:1). */
  construction: '#5f86bd',
  /** Red markup pencil: revisions, HOLD notes, selection, the primary action. */
  redline: '#ff8c7a',
  /** Checker's yellow: keyboard focus, "verified, follow it". */
  checker: '#ffd23f',
} as const;

export type PaletteToken = keyof typeof palette;

/** Tokens that may colour text. `construction` is deliberately absent. */
export const textTokens: PaletteToken[] = ['blueprint', 'faded', 'redline', 'checker'];
