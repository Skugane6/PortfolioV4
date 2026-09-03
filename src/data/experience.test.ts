import { describe, it, expect } from 'vitest';
import { experience, education } from './experience';

describe('experience data', () => {
  it('contains the Mitsubishi Heavy Industries role with real dates', () => {
    const role = experience.find((entry) => entry.company === 'Mitsubishi Heavy Industries');
    expect(role).toBeDefined();
    expect(role?.role).toBe('Software Engineering Intern');
    expect(role?.start).toBe('05/2024');
    expect(role?.end).toBe('08/2025');
    expect(role?.highlights.length).toBeGreaterThan(0);
  });

  it('states the education record from the resume', () => {
    expect(education.school).toBe('Western University');
    expect(education.program).toBe('B.E.Sc. Software Engineering');
    expect(education.graduation).toBe('06/2026');
  });
});
