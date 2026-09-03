import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from './Hero';
import { useCanRender3D } from '../hooks/useCanRender3D';

vi.mock('../hooks/useCanRender3D', () => ({ useCanRender3D: vi.fn() }));
vi.mock('./particleField/ParticleField', () => ({
  ParticleField: () => <div data-testid="particle-field-canvas" />,
}));

describe('Hero', () => {
  it('renders the name and positioning line', () => {
    vi.mocked(useCanRender3D).mockReturnValue(false);
    render(<Hero />);
    expect(screen.getByText('Searan Kuganesan')).toBeInTheDocument();
    expect(
      screen.getByText(/I build the systems operators run their business on/)
    ).toBeInTheDocument();
  });

  it('renders the static fallback when 3D is disabled', () => {
    vi.mocked(useCanRender3D).mockReturnValue(false);
    render(<Hero />);
    expect(screen.getByTestId('particle-field-fallback')).toBeInTheDocument();
  });

  it('renders the particle canvas when 3D is enabled', async () => {
    vi.mocked(useCanRender3D).mockReturnValue(true);
    render(<Hero />);
    expect(await screen.findByTestId('particle-field-canvas')).toBeInTheDocument();
  });

  it('gives the headshot real alt text', () => {
    vi.mocked(useCanRender3D).mockReturnValue(false);
    render(<Hero />);
    expect(screen.getByAltText('Searan Kuganesan')).toBeInTheDocument();
  });
});
