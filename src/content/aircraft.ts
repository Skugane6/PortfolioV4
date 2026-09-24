import type { SpecRow } from './types';

/**
 * Published dimensions for the two variants the Experience work spanned.
 * The old block printed CRJ700 length with CRJ900 wingspan and height under
 * one heading; this is the corrected two-column form (NEEDS-FROM-SEARAN #5).
 */
export const aircraft = {
  family: 'CRJ700 series',
  kind: 'Regional jet',
  /** What the drawing is scaled as (lib/stations DRAWING.lengthM). */
  drawnAs: 'CRJ700',
  overallLength: '32.5 m (106.6 ft)',
  spec: [
    { label: 'Length', crj700: '32.5 m', crj900: '36.2 m' },
    { label: 'Wingspan', crj700: '23.2 m', crj900: '24.9 m' },
    { label: 'Height', crj700: '7.6 m', crj900: '7.5 m' },
  ] satisfies SpecRow[],
  sources: [
    {
      label: 'SkyWest, CRJ700 fact sheet',
      href: 'https://files-skywest-com.s3.us-west-2.amazonaws.com/public/Uploads/Documents/Operations/FactSheet-CRJ700-UA2.pdf',
    },
    { label: 'Wikipedia, Bombardier CRJ700 series', href: 'https://en.wikipedia.org/wiki/Bombardier_CRJ700_series' },
  ],
  stationNote:
    'Stations are measured on this drawing, in inches aft of the nose, at the CRJ700’s 32.5 m length. Schematic, not manufacturer station data.',
} as const;
