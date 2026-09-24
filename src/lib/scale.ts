/** CSS defines 1in as 96px, so a rendered width has a real length on paper. */
const CSS_PX_PER_METRE = 96 / 0.0254;

/**
 * The drawing's scale as the denominator N of 1:N, from the width the drawn
 * object currently occupies on screen and the object's real length. A 1100px
 * CRJ700 is drawn at 1:112.
 */
export function drawingScale(renderedPx: number, realLengthM: number): number {
  const drawnM = renderedPx / CSS_PX_PER_METRE;
  return Math.max(1, Math.round(realLengthM / drawnM));
}
