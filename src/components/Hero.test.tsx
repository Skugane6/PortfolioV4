import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the headline as one continuous sentence', () => {
    render(<Hero />);
    // The headline is four separately-animated block spans; asserting on the
    // whole heading is what catches a missing space between them.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'I build scalable systems that create real impact.',
    );
  });

  it('renders the name and role in the decorative lockup', () => {
    render(<Hero />);
    expect(screen.getByText('SEARAN KUGANESAN')).toBeInTheDocument();
    expect(screen.getByText('SOFTWARE ENGINEER')).toBeInTheDocument();
  });

  it('renders the supporting copy', () => {
    render(<Hero />);
    expect(screen.getByText(/streamline complex workflows/i)).toBeInTheDocument();
  });

  it('links the primary CTA to the projects section', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /See My Work/i });
    expect(link).toHaveAttribute('href', '#projects');
  });

  it('links the résumé button at a downloadable PDF', () => {
    render(<Hero />);
    // The imported design pointed this at a #resume placeholder. The real
    // PDF is what has to survive any future re-import.
    const link = screen.getByRole('link', { name: /Download Résumé/i });
    expect(link).toHaveAttribute('href', '/skuganesan_resume.pdf');
    expect(link).toHaveAttribute('download');
  });

  it('shows the portrait and the one institutional mark, and nothing else', () => {
    const { container } = render(<Hero />);
    // The stage is drawn entirely in CSS and SVG, so these two are the only
    // <img> elements the section is allowed; a third means panel artwork has
    // crept back in. The Western mark carries an empty alt on purpose: the
    // term beside it already names it, so an alt would say it twice.
    const images = [...container.querySelectorAll('img')];
    expect(images.map((img) => img.getAttribute('alt'))).toEqual(['Searan Kuganesan', '']);
    expect(images[1]).toHaveAttribute('src', '/western-mark.png');
    expect(screen.getByRole('img', { name: 'Searan Kuganesan' })).toBeInTheDocument();
  });

  it('hides the decorative stage from assistive tech', () => {
    render(<Hero />);
    // The stage is mock UI chrome and unlabelled glyphs, so it is hidden as
    // one subtree rather than annotated piece by piece. queryByText does not
    // filter on aria-hidden, so assert on containment instead of absence.
    for (const text of ['SCALABLE SOLUTIONS', 'REAL-WORLD IMPACT', 'DEPLOY']) {
      expect(screen.getByText(text).closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('backs the impact claim with a spec sheet, not an employer', () => {
    render(<Hero />);
    // The headline promises "real impact" and the old hero showed none until
    // you scrolled. These are facts about the engineer and the software:
    // what he ships, what he ships it in, and the credential.
    for (const [value, label] of [
      ['10', 'PROJECTS SHIPPED'],
      ['2026', 'B.E.SC SOFTWARE ENG'],
    ]) {
      const term = screen.getByText(label);
      expect(term.closest('div')).toHaveTextContent(value);
    }
    // The Western cell prints no caption, since the lockup says "Western" itself.
    // Its term is hidden with opacity rather than sr-only so that it still
    // holds the label row open under the mark, and still reaches AT.
    const term = screen.getByText('WESTERN UNIVERSITY');
    expect(term).toHaveClass('opacity-0');
    const cell = term.closest('div');
    expect(cell).not.toBeNull();
    expect(cell).toContainElement(cell!.querySelector('img'));
  });

  it('keeps the employer out of the hero', () => {
    render(<Hero />);
    // The strip used to carry a "MITSUBISHI HEAVY INDUSTRIES · CRAFTTRAQ"
    // attribution rule. The Experience section is where that belongs.
    expect(screen.queryByText(/mitsubishi/i)).not.toBeInTheDocument();
  });

  it('links the live-product metric at the product', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /CRAFTTRAQ SAAS/i });
    expect(link).toHaveAttribute('href', 'https://crafttraq.com');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('offers the three contact routes with labelled icon-only links', () => {
    render(<Hero />);
    // The glyphs are decorative SVG with no text, so the aria-label is the
    // whole accessible name, and losing it leaves three unnamed links.
    for (const [label, href] of [
      ['GitHub', 'https://github.com/skugane6'],
      ['LinkedIn', 'https://linkedin.com/in/searan-kuganesan'],
      ['Email', 'mailto:searan.kuganesan4@gmail.com'],
    ]) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });

  it('states the role once, not once per lockup', () => {
    render(<Hero />);
    // The header lockup owns the job title. The eyebrow beside the portrait
    // used to repeat it verbatim; getByText throws on a second exact match,
    // so this fails the moment it comes back.
    expect(screen.getByText('SOFTWARE ENGINEER')).toBeInTheDocument();
  });

  it('does not duplicate the section nav that NavRail already renders', () => {
    render(<Hero />);
    // The imported design shipped its own right-edge 01..05 nav; NavRail is
    // the real one, so the hero must not render a second.
    expect(screen.queryByRole('link', { name: /EXPERIENCE/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /CONTACT/i })).not.toBeInTheDocument();
  });
});
