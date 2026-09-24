import { describe, expect, it } from 'vitest';
import { buildCommands, filterCommands } from './commands';

const cmds = buildCommands({ reduced: false, crosshair: true, finePointer: true });
const labels = (q: string) => filterCommands(cmds, q).map((c) => c.label);

describe('command palette search', () => {
  it('lists everything for an empty query', () => {
    expect(labels('')).toHaveLength(cmds.length);
  });

  it('finds the résumé with or without the accent', () => {
    expect(labels('resume')[0]).toBe('Download résumé (PDF)');
    expect(labels('résumé')[0]).toBe('Download résumé (PDF)');
  });

  it('finds sheets by number and projects by stack', () => {
    expect(labels('sheet 4')[0]).toBe('Skills');
    expect(labels('fastapi')).toContain('Open CraftTraq');
  });

  it('prefers label prefixes', () => {
    expect(labels('open g')[0]).toBe('Open GitHub');
  });

  it('returns nothing for nonsense', () => {
    expect(labels('zzzz')).toEqual([]);
  });

  it('offers the crosshair only to fine pointers with motion on', () => {
    const touch = buildCommands({ reduced: false, crosshair: true, finePointer: false });
    expect(touch.some((c) => c.id === 'crosshair')).toBe(false);
    const reduced = buildCommands({ reduced: true, crosshair: true, finePointer: true });
    expect(reduced.find((c) => c.id === 'motion')?.label).toBe('Turn motion on');
  });
});
