import { describe, it, expect } from 'vitest';
import { skills } from './skills';
import { skillMarks } from './skillIcons';

describe('skills data', () => {
  it('leads with the things the product is actually built in', () => {
    expect(skills.slice(0, 3).map((skill) => skill.name)).toEqual(['React', 'TypeScript', 'Python']);
  });

  it('points every skill at a mark that actually exists', () => {
    skills.forEach((skill) => {
      expect(skillMarks[skill.icon], `${skill.name} -> ${skill.icon}`).toBeDefined();
    });
  });

  it('lists each skill once', () => {
    expect(new Set(skills.map((skill) => skill.name)).size).toBe(skills.length);
  });

  it('keeps the detail that used to live in the skill name', () => {
    expect(skills.find((skill) => skill.name === 'AWS')?.note).toBe('S3 · Lambda · Transcribe');
  });
});
