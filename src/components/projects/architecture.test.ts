import { describe, expect, it } from 'vitest';
import { projects } from '../../content/projects';
import { layoutArchitecture, segmentCrossesBox } from './architecture';

describe('layoutArchitecture', () => {
  it.each(projects.map((p) => [p.name, p] as const))('routes every %s edge without crossing another box', (_name, project) => {
    const { nodes, routes } = layoutArchitecture(project.caseStudy.architecture.nodes, project.caseStudy.architecture.edges);
    for (const route of routes) {
      for (let i = 0; i < route.points.length - 1; i++) {
        const p = route.points[i];
        const q = route.points[i + 1];
        expect(p[0] === q[0] || p[1] === q[1]).toBe(true); // orthogonal
        for (const n of nodes) {
          if (n.id === route.from || n.id === route.to) continue;
          expect(segmentCrossesBox(p, q, n), `${route.from}→${route.to} crosses ${n.id}`).toBe(false);
        }
      }
    }
  });

  it('keeps external nodes outside the product boundary', () => {
    for (const p of projects) {
      const { nodes, boundary } = layoutArchitecture(p.caseStudy.architecture.nodes, p.caseStudy.architecture.edges);
      if (!boundary) continue;
      for (const n of nodes.filter((node) => !node.inside)) {
        const overlaps = n.y < boundary.y + boundary.h && n.y + n.h > boundary.y;
        expect(overlaps, `${p.id}: ${n.id} sits inside the boundary`).toBe(false);
      }
    }
  });

  it('ends a boundary edge on the boundary line', () => {
    const crafttraq = projects[0].caseStudy.architecture;
    const { routes, boundary } = layoutArchitecture(crafttraq.nodes, crafttraq.edges);
    const stripe = routes.find((r) => r.from === 'stripe')!;
    expect(stripe.points.at(-1)![1]).toBe(boundary!.y);
  });
});
