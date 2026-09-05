import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaneCutawaySvg } from './PlaneCutawaySvg';

describe('PlaneCutawaySvg', () => {
  it('renders the cargo and avionics bay labels', () => {
    render(<PlaneCutawaySvg />);
    expect(screen.getByText('CARGO')).toBeInTheDocument();
    expect(screen.getByText('AVIONICS')).toBeInTheDocument();
  });

  it('renders the wingspan dimension callout', () => {
    render(<PlaneCutawaySvg />);
    expect(screen.getByText('36.40 m')).toBeInTheDocument();
  });
});
