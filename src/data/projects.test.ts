import { describe, it, expect } from 'vitest';
import { featuredProject, secondaryProjects } from './projects';

describe('projects data', () => {
  it('describes CraftTraq as the featured case study with its real stack', () => {
    expect(featuredProject.name).toBe('CraftTraq');
    expect(featuredProject.featured).toBe(true);
    expect(featuredProject.stack).toEqual(['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL']);
    expect(featuredProject.screenshot.src).toBe('/crafttraq.png');
    expect(featuredProject.screenshot.webp).toBe('/crafttraq.webp');
  });

  it('lists the secondary projects', () => {
    const names = secondaryProjects.map((project) => project.name);
    expect(names).toEqual([
      'Portfolio Risk Dashboard',
      'Multi-Model Text Classification Pipeline',
      'Eye-Mouse',
    ]);
    secondaryProjects.forEach((project) => expect(project.featured).toBe(false));
  });
});
