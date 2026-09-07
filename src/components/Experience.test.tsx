import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Experience, SECTION_VH } from './Experience';
import { SURVEY_END, CLEAR_END } from './experience/departure';
import { experience, education } from '../data/experience';

// The survey used to own the whole 400vh section, of which 100vh is the
// sticky stage itself. The departure was added by lengthening the section,
// not by compressing the survey, so this is the distance it must still get.
const SURVEY_TRAVEL_VH = 300;

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

  // The pinned travel carries the survey *and* the clear-out, so the survey's
  // share of it is SURVEY_END/CLEAR_END. Guards the pairing of the three
  // numbers: changing the height without the ratio (or the reverse) silently
  // re-times how fast the callouts arrive, which is exactly the regression
  // that is hard to spot by eye.
  it('gives the survey the same scroll distance it had before the departure', () => {
    expect((SURVEY_END / CLEAR_END) * (SECTION_VH - 100)).toBeCloseTo(SURVEY_TRAVEL_VH, 4);
  });

  // The title block and the education line name who the work belonged to —
  // they are the substance of the section, not drafting furniture, so they
  // ride the departure out rather than clearing with the sheet. Asserted
  // structurally because jsdom cannot resolve the custom property itself.
  it('keeps the title block and education line out of the sheet clear-out', () => {
    const { container } = render(<Experience />);
    const section = container.querySelector('#experience') as HTMLElement;
    // jsdom cannot evaluate custom properties, so it rewrites any
    // `opacity: var(...)` or `opacity: calc(...)` to `opacity: NaN` — which
    // is exactly the signal wanted here. A NaN opacity is a scroll-driven
    // fade; a plain number is a static one, like the 0.88 that flattens the
    // company mark into the sheet's ink. Only the former is disqualifying.
    const fadesWithSheet = (el: Element | null) => {
      for (let n = el; n && n !== section; n = n.parentElement) {
        if (/opacity\s*:\s*NaN/.test(n.getAttribute('style') ?? '')) return true;
      }
      return false;
    };

    const logo = container.querySelector(`img[src="${experience[0].logo}"]`);
    expect(fadesWithSheet(logo)).toBe(false);
    expect(fadesWithSheet(screen.getByText(experience[0].company))).toBe(false);
    expect(fadesWithSheet(screen.getByText(experience[0].role))).toBe(false);
    expect(
      fadesWithSheet(
        screen.getByText(`${education.program}, ${education.school} · ${education.graduation}`)
      )
    ).toBe(false);
  });

  it('renders the departure wake canvas', () => {
    const { container } = render(<Experience />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  describe('with reduced motion', () => {
    const original = window.matchMedia;

    afterEach(() => {
      window.matchMedia = original;
    });

    // The departure degrades to a plain fade there, so a particle field has
    // nothing to attach to and should not be mounted at all.
    it('omits the wake canvas entirely', () => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;

      const { container } = render(<Experience />);
      expect(container.querySelector('canvas')).toBeNull();
    });
  });
});
