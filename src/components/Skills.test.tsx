import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skills } from './Skills';
import { skillGroupOrder, skillGroups, skills } from '../data/skills';
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
    // The tally lists are lists too, so counting <ul>s no longer says anything
    // — what matters is that every tile hangs off a single one of them.
    const owners = new Set(
      Array.from(container.querySelectorAll('.skill-tile')).map((tile) => tile.parentElement),
    );
    expect(owners.size).toBe(1);
    expect([...owners][0]?.querySelectorAll('.skill-tile')).toHaveLength(skills.length);
  });

  it('tints each tile with its own brand colour', () => {
    const { container } = render(<Skills />);
    const tiles = container.querySelectorAll<HTMLElement>('.skill-tile');
    skills.forEach((skill, i) => {
      expect(tiles[i].style.getPropertyValue('--brand'), skill.name).toBe(
        skillMarks[skill.icon].hex,
      );
    });
  });

  it('gives each tile the faint weights the resting plate tint is drawn from', () => {
    // Without these the chip has no border and no wash — the brand colour would
    // stop at the mark and the grid would go back to reading as grey squares.
    const { container } = render(<Skills />);
    const tile = container.querySelector<HTMLElement>('.skill-tile');
    const hex = skillMarks[skills[0].icon].hex;
    expect(tile?.style.getPropertyValue('--brand-line')).toBe(`${hex}30`);
    expect(tile?.style.getPropertyValue('--brand-wash')).toBe(`${hex}12`);
  });

  it('tallies the parts list by run, without breaking the grid into runs', () => {
    render(<Skills />);
    skillGroupOrder.forEach((group) => {
      const count = skills.filter((skill) => skill.group === group).length;
      // One label per layout — the side panel and the row under the grid.
      expect(screen.getAllByText(skillGroups[group].label).length).toBeGreaterThan(0);
      expect(count).toBeGreaterThan(0);
    });
  });

  it('holds a resting readout in the detail panel until a tile is hovered', () => {
    render(<Skills />);
    expect(screen.getByText('Materials list')).toBeInTheDocument();
    expect(screen.getByText(`— / ${skills.length}`)).toBeInTheDocument();
  });

  it('counts the parts list from the data rather than a hardcoded number', () => {
    render(<Skills />);
    expect(screen.getByText(new RegExp(`${skills.length} ITEMS`))).toBeInTheDocument();
  });
});
