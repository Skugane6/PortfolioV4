/**
 * Stations are positions along the airframe in inches aft of the nose, the
 * way fuselage stations are given on real drawings. These are measured on
 * this site's own drawing (see components/drawing/airframeGeometry.ts), scaled
 * so the drawn overall length is the CRJ700's published 32.51 m. They are
 * schematic: not manufacturer station data, and the drawing says so.
 */
export const DRAWING = {
  /** Drawing x of the nose tip. */
  noseX: 2,
  /** Drawing x of the aftmost point (horizontal stabiliser tip). */
  tailX: 2106,
  /** CRJ700 overall length, metres (SkyWest CRJ700 fact sheet: 32.51 m). */
  lengthM: 32.51,
} as const;

const INCHES_PER_METRE = 39.3701;
const inchesPerUnit = (DRAWING.lengthM * INCHES_PER_METRE) / (DRAWING.tailX - DRAWING.noseX);

export function stationFromX(x: number): number {
  return Math.round((x - DRAWING.noseX) * inchesPerUnit);
}

export function xFromStation(station: number): number {
  return DRAWING.noseX + station / inchesPerUnit;
}
