import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Experience } from './Experience';
import { experience, education } from '../data/experience';

describe('Experience', () => {
  it('renders the Mitsubishi role with its dates', () => {
    render(<Experience />);
    expect(screen.getByText(`${experience[0].role} · ${experience[0].company}`)).toBeInTheDocument();
    expect(screen.getByText(`${experience[0].start} – ${experience[0].end}`)).toBeInTheDocument();
  });

  it('renders every highlight bullet for the role', () => {
    render(<Experience />);
    experience[0].highlights.forEach((line) => {
      expect(screen.getByText(line)).toBeInTheDocument();
    });
  });

  it('renders the education line', () => {
    render(<Experience />);
    expect(
      screen.getByText(`${education.program}, ${education.school} · ${education.graduation}`)
    ).toBeInTheDocument();
  });

  it('renders the initial cutaway phase and progress readout', () => {
    render(<Experience />);
    expect(screen.getByText('HULL CLOSED')).toBeInTheDocument();
    expect(screen.getByText('00%')).toBeInTheDocument();
  });
});
