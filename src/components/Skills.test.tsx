import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skills } from './Skills';
import { skills } from '../data/skills';
import { skillMarks } from '../data/skillIcons';

describe('Skills', () => {
  it('renders every skill name', () => {
    render(<Skills />);
    skills.forEach((skill) => {
      expect(screen.getByText(skill.name)).toBeInTheDocument();
    });
  });

  it('draws a logo for every skill', () => {
    const { container } = render(<Skills />);
    // Each tile renders one mark; the corner-bracket overlay is a separate svg
    // carrying .skill-ticks, so counting marks means counting .skill-mark svgs.
    expect(container.querySelectorAll('.skill-mark svg')).toHaveLength(skills.length);
  });

  it('puts every skill in one grid rather than separate group panels', () => {
    const { container } = render(<Skills />);
    const lists = container.querySelectorAll('ul');
    expect(lists).toHaveLength(1);
    expect(lists[0].querySelectorAll('.skill-tile')).toHaveLength(skills.length);
  });

  it('tints each tile with its own brand colour', () => {
    const { container } = render(<Skills />);
    const tile = container.querySelector<HTMLElement>('.skill-tile');
    expect(tile?.style.getPropertyValue('--brand')).toBe(skillMarks[skills[0].icon].hex);
  });

  it('counts the parts list from the data rather than a hardcoded number', () => {
    render(<Skills />);
    expect(screen.getByText(new RegExp(`${skills.length} ITEMS`))).toBeInTheDocument();
  });
});
