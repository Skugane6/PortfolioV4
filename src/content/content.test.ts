import { describe, expect, it } from 'vitest';
import { profile } from './profile';
import { roles } from './experience';
import { projects } from './projects';
import { skills } from './skills';
import { sheets } from './sheets';
import { aircraft } from './aircraft';

function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  return [];
}

describe('content', () => {
  it('has no empty text fields', () => {
    // alt="" is how a decorative image is marked, so it is the one field allowed to be empty.
    const empties = strings({ profile, roles, projects, skills, sheets, aircraft }).filter(
      ([path, s]) => s.trim() === '' && !path.endsWith('.alt'),
    );
    expect(empties).toEqual([]);
  });

  it('numbers the sheets 01–05 in page order', () => {
    expect(sheets.map((s) => s.number)).toEqual([1, 2, 3, 4, 5]);
    expect(sheets.map((s) => s.id)).toEqual(['cover', 'experience', 'projects', 'skills', 'contact']);
  });

  it('keeps the MHI callouts fore to aft on the measured stations', () => {
    const stations = roles[0].callouts.map((c) => c.station);
    expect(stations).toEqual([145, 616, 942, 1116]);
    expect([...stations].sort((a, b) => a - b)).toEqual(stations);
  });

  it('keeps every existing experience fact verbatim', () => {
    const [mhi] = roles;
    expect(mhi.company).toBe('Mitsubishi Heavy Industries');
    expect(mhi.role).toBe('Software Engineering Intern');
    expect([mhi.start, mhi.end, mhi.location]).toEqual(['05/2024', '08/2025', 'Mississauga, Canada']);
    expect(mhi.callouts.map((c) => c.title)).toEqual([
      'Component Tracker',
      'Aircraft Utilization Forecasting',
      '10-Year Fleet Prediction Model',
      'Maintenance Scheduling Engine',
    ]);
  });

  it('draws each impact line from its own card text', () => {
    for (const c of roles[0].callouts) {
      const source = `${c.description} ${c.tags.join(' ')}`;
      const figures = c.impact.match(/[\d,]+\+?%?/g) ?? [];
      for (const figure of figures) expect(source).toContain(figure);
    }
  });

  it('gives each project a unique figure number in order', () => {
    expect(projects.map((p) => p.fig)).toEqual([1, 2, 3, 4]);
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
  });

  it('never shows the unsourced metrics the old project visuals printed', () => {
    const text = strings(projects).map(([, s]) => s).join('\n');
    for (const banned of ['1.84', '14.2%', '7.7%', '-2.4%', '94.1%', '0.921', '0.936', '0.908', '18ms', '0.7°', 'RUN 47']) {
      expect(text).not.toContain(banned);
    }
  });

  it('only connects architecture nodes that exist', () => {
    for (const p of projects) {
      const ids = new Set(p.caseStudy.architecture.nodes.map((n) => n.id));
      for (const e of p.caseStudy.architecture.edges) {
        expect(ids.has(e.from)).toBe(true);
        expect(e.to === 'boundary' || ids.has(e.to)).toBe(true);
      }
    }
  });

  it('keeps the cover proof items, including the flagged 10', () => {
    expect(profile.email).toBe('searan.kuganesan4@gmail.com');
    const shipped = profile.proof.find((p) => p.id === 'projects-shipped');
    expect(shipped).toMatchObject({ figure: '10', label: 'projects shipped', target: null });
    for (const p of profile.proof) if (p.target) expect(p.target.href.startsWith('#')).toBe(true);
  });

  it('lists 28 unique parts', () => {
    expect(skills).toHaveLength(28);
    expect(new Set(skills.map((s) => s.name)).size).toBe(28);
  });

  it('prints one aircraft per column in the spec table', () => {
    expect(aircraft.spec.map((r) => r.label)).toEqual(['Length', 'Wingspan', 'Height']);
    expect(aircraft.spec[0].crj700).toBe('32.5 m');
  });
});
