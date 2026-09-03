import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skills } from './Skills';
import { skillGroups } from '../data/skills';

describe('Skills', () => {
  it('renders every group heading', () => {
    render(<Skills />);
    skillGroups.forEach((group) => {
      expect(screen.getByText(group.title)).toBeInTheDocument();
    });
  });

  it('renders every skill tag', () => {
    render(<Skills />);
    skillGroups.forEach((group) => {
      group.skills.forEach((skill) => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    });
  });
});
