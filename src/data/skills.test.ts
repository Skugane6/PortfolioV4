import { describe, it, expect } from 'vitest';
import { skillGroups } from './skills';

describe('skills data', () => {
  it('groups skills the way a colleague would hear them described, not as a flat list', () => {
    const titles = skillGroups.map((group) => group.title);
    expect(titles).toEqual([
      'Ship it',
      'Talk to other systems',
      'Move and shape data',
      'Keep it from breaking',
    ]);
  });

  it('includes React and PostgreSQL under Ship it', () => {
    const shipIt = skillGroups.find((group) => group.id === 'ship-it');
    expect(shipIt?.skills).toContain('React');
    expect(shipIt?.skills).toContain('PostgreSQL');
  });
});
