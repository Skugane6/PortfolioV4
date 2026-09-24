import { describe, expect, it } from 'vitest';
import { DRAWING, stationFromX, xFromStation } from './stations';

describe('drawing stations', () => {
  it('puts station 0 at the nose and the full length, in inches, at the far tail', () => {
    expect(stationFromX(DRAWING.noseX)).toBe(0);
    expect(stationFromX(DRAWING.tailX)).toBe(Math.round(DRAWING.lengthM * 39.3701));
  });

  it('round-trips between drawing x and station', () => {
    expect(Math.round(xFromStation(stationFromX(1020)))).toBe(1020);
  });

  it('places the four Experience callouts where the drawing has them', () => {
    expect([240, 1015, 1551, 1836].map(stationFromX)).toEqual([145, 616, 942, 1116]);
  });
});
