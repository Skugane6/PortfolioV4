import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the closing line', () => {
    render(<Footer />);
    expect(screen.getByText('BUILT BY SEARAN KUGANESAN')).toBeInTheDocument();
  });
});
