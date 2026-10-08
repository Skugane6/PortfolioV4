import { describe, expect, it } from 'vitest';
import { roles } from '../content/experience';
import { projects } from '../content/projects';
import { resumeLines, resumeSkillsList } from '../content/resume';
import { skills } from '../content/skills';
import { deriveUsage, mentions } from './usage';

const usage = deriveUsage(skills, roles, projects, resumeLines, resumeSkillsList);
const places = (name: string) => usage.get(name)!.refs.map((r) => r.label);

describe('mentions', () => {
  it('matches whole words, case-insensitively, through punctuation', () => {
    expect(mentions('Python/Flask RESTful', 'Flask')).toBe(true);
    expect(mentions('React 19', 'React')).toBe(true);
    expect(mentions('Pandas', 'pandas')).toBe(true);
    expect(mentions('CI/CD pipelines', 'CI/CD')).toBe(true);
    expect(mentions('GitHub repo', 'Git')).toBe(false);
    expect(mentions('scikit-learn regression', 'scikit-learn')).toBe(true);
  });
});

describe('deriveUsage', () => {
  it('finds React in the component tracker and three projects', () => {
    expect(places('React')).toEqual(['Component Tracker', 'CraftTraq', 'Genshillion', 'Portfolio Risk Dashboard']);
  });

  it('finds Oracle in the maintenance engine and the résumé’s ETL work', () => {
    const refs = usage.get('Oracle')!.refs;
    expect(refs.map((r) => r.kind)).toEqual(['callout', 'resume']);
    expect(refs[0].label).toBe('Maintenance Scheduling Engine');
  });

  it('counts each place once, however many times it names the part', () => {
    // CraftTraq names Stripe in its stack, a build line and its status.
    expect(places('Stripe')).toEqual(['CraftTraq']);
  });

  it('cites résumé lines only for work the site does not already show', () => {
    expect(places('pytest')).toEqual(['Mitsubishi Heavy Industries (résumé)']);
  });

  it('marks parts that appear only in the résumé’s skills list', () => {
    const docker = usage.get('Docker')!;
    expect(docker.refs).toEqual([]);
    expect(docker.listedOnResume).toBe(true);
  });

  it('covers every part', () => {
    for (const s of skills) expect(usage.has(s.name), s.name).toBe(true);
  });
});
