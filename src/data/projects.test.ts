import { describe, it, expect } from 'vitest';
import { projects } from './projects';

describe('projects data', () => {
  it('leads with CraftTraq as the live featured build, with its real stack', () => {
    const [featured] = projects;
    expect(featured.name).toBe('CraftTraq');
    expect(featured.live).toBe(true);
    expect(featured.visual).toBe('crafttraq');
    expect(featured.stack).toEqual([
      'React 19',
      'TypeScript',
      'FastAPI',
      'PostgreSQL',
      'Stripe',
      'Supabase',
    ]);
    expect(featured.links).toEqual([{ label: 'VISIT LIVE SITE', href: 'https://crafttraq.com' }]);
  });

  it('lists four projects in flight-line order, with CraftTraq and Genshillion live', () => {
    expect(projects.map((project) => project.name)).toEqual([
      'CraftTraq',
      'Genshillion',
      'Portfolio Risk Dashboard',
      'Text Classification Pipeline',
    ]);
    expect(projects.filter((project) => project.live).map((project) => project.name)).toEqual([
      'CraftTraq',
      'Genshillion',
    ]);
  });

  it('gives every project its own visual panel and a station reference', () => {
    const visuals = projects.map((project) => project.visual);
    expect(new Set(visuals).size).toBe(projects.length);
    projects.forEach((project) => expect(project.station).toMatch(/^STA \d{3} · /));
  });
});
