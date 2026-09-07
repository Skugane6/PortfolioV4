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
    // The imported design pointed this at a #resume placeholder — the real
    // PDF is what has to survive any future re-import.
    const link = screen.getByRole('link', { name: /Download Résumé/i });
    expect(link).toHaveAttribute('href', '/skuganesan_resume.pdf');
    expect(link).toHaveAttribute('download');
  });

  it('shows the portrait, and builds the rest of the scene without images', () => {
    const { container } = render(<Hero />);
    // The stage is drawn entirely in CSS and SVG, so the portrait should be
    // the only <img> in the section — a second one means panel artwork has
    // crept back in.
    expect(container.querySelectorAll('img')).toHaveLength(1);
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

  it('does not duplicate the section nav that NavRail already renders', () => {
    render(<Hero />);
    // The imported design shipped its own right-edge 01..05 nav; NavRail is
    // the real one, so the hero must not render a second.
    expect(screen.queryByRole('link', { name: /EXPERIENCE/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /CONTACT/i })).not.toBeInTheDocument();
  });
});
