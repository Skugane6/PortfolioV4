import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetworkFieldFallback } from './NetworkFieldFallback';

describe('NetworkFieldFallback', () => {
  it('renders a decorative, aria-hidden element', () => {
    render(<NetworkFieldFallback />);
    const el = screen.getByTestId('network-field-fallback');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
});
