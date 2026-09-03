import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Contact } from './Contact';

describe('Contact', () => {
  it('renders a mailto link to the real email address', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: 'EMAIL' })).toHaveAttribute(
      'href',
      'mailto:searan.kuganesan4@gmail.com'
    );
  });

  it('renders real GitHub, LinkedIn, and CraftTraq links', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: 'GITHUB' })).toHaveAttribute('href', 'https://github.com/skugane6');
    expect(screen.getByRole('link', { name: 'LINKEDIN' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/searan-kuganesan'
    );
    expect(screen.getByRole('link', { name: 'CRAFTTRAQ' })).toHaveAttribute('href', 'https://crafttraq.com');
  });
});
