import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the headline', () => {
    render(<Hero />);
    expect(screen.getByText(/I build/)).toBeInTheDocument();
    expect(screen.getByText('scalable systems')).toBeInTheDocument();
    expect(screen.getByText(/that create real/)).toBeInTheDocument();
  });

  it('renders the name and role in the decorative lockup', () => {
    render(<Hero />);
    expect(screen.getByText('SEARAN KUGANESAN')).toBeInTheDocument();
    expect(screen.getByText('SOFTWARE ENGINEER')).toBeInTheDocument();
  });

  it('links the primary CTA to the projects section', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /See My Work/i });
    expect(link).toHaveAttribute('href', '#projects');
  });

  it('links the résumé button at a downloadable PDF', () => {
    render(<Hero />);
    const link = screen.getByRole('link', { name: /Download Résumé/i });
    expect(link).toHaveAttribute('href', '/skuganesan_resume.pdf');
    expect(link).toHaveAttribute('download');
  });

  it('hides the decorative panel composition from assistive tech', () => {
    const { container } = render(<Hero />);
    const images = container.querySelectorAll('img');
    images.forEach((img) => expect(img).toHaveAttribute('alt', ''));
  });
});
