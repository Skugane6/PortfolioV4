import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Experience } from './Experience';
import { experience, education } from '../data/experience';

describe('Experience', () => {
  it('renders the role, company, and dates', () => {
    render(<Experience />);
    expect(screen.getByText(experience[0].company)).toBeInTheDocument();
    expect(screen.getByText(experience[0].role)).toBeInTheDocument();
    expect(
      screen.getByText(`${experience[0].start} – ${experience[0].end} · ${experience[0].location}`)
    ).toBeInTheDocument();
  });

  // The title block is pinned rather than faded with the rest of the intro
  // copy, so the company mark has to be on the sheet at all times.
  it('renders the company logo in the title block', () => {
    const { container } = render(<Experience />);
    expect(container.querySelector(`img[src="${experience[0].logo}"]`)).toBeInTheDocument();
  });

  // Scoped to each callout's own panel rather than the whole sheet: the
  // drawing's spec block names the aircraft too, so a bare text query for a
  // tag like "CRJ700 / 900" matches the drafting furniture as well.
  it('renders every callout with its title, description, and tags', () => {
    const { container } = render(<Experience />);
    experience[0].callouts.forEach((callout, i) => {
      const panel = container.querySelector(`[data-card-index="${i}"]`);
      expect(panel).not.toBeNull();
      const card = within(panel as HTMLElement);
      expect(card.getByText(callout.station)).toBeInTheDocument();
      expect(card.getByText(callout.title)).toBeInTheDocument();
      expect(card.getByText(callout.description)).toBeInTheDocument();
      expect(card.getByText(callout.caption)).toBeInTheDocument();
      callout.tags.forEach((tag) => {
        expect(card.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  it('renders the education line', () => {
    render(<Experience />);
    expect(
      screen.getByText(`${education.program}, ${education.school} · ${education.graduation}`)
    ).toBeInTheDocument();
  });

  it('renders the initial phase and progress readout', () => {
    render(<Experience />);
    expect(screen.getByText('Datum')).toBeInTheDocument();
    expect(screen.getByText('00%')).toBeInTheDocument();
  });
});
