import { describe, expect, it } from 'vitest';
import { formatZoneTime, msToNextMinute } from './time';

describe('formatZoneTime', () => {
  it('formats a 24-hour clock in the given zone', () => {
    // 18:32 UTC is 14:32 in Toronto during daylight time.
    expect(formatZoneTime(new Date('2026-09-24T18:32:00Z'), 'America/Toronto')).toBe('14:32');
  });

  it('follows the zone across the daylight-saving change', () => {
    // January: Toronto is UTC-5.
    expect(formatZoneTime(new Date('2026-01-15T05:07:00Z'), 'America/Toronto')).toBe('00:07');
  });
});

describe('msToNextMinute', () => {
  it('counts down to the next minute boundary', () => {
    expect(msToNextMinute(new Date('2026-09-24T18:32:45.500Z'))).toBe(14_500);
    expect(msToNextMinute(new Date('2026-09-24T18:32:00.000Z'))).toBe(60_000);
  });
});
