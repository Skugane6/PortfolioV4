import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParticleFieldFallback } from './ParticleFieldFallback';

describe('ParticleFieldFallback', () => {
  it('renders a decorative, aria-hidden element', () => {
    render(<ParticleFieldFallback />);
    const el = screen.getByTestId('particle-field-fallback');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
});
