const formatters = new Map<string, Intl.DateTimeFormat>();

/** "14:32" in the given IANA zone, 24-hour, independent of the viewer's locale. */
export function formatZoneTime(date: Date, timeZone: string): string {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    formatters.set(timeZone, fmt);
  }
  return fmt.format(date);
}

/** Milliseconds until the next whole minute, so a clock can tick on the boundary. */
export function msToNextMinute(date: Date): number {
  const into = date.getTime() % 60_000;
  return 60_000 - into;
}
