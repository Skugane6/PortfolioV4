import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaneCutawaySvg } from './PlaneCutawaySvg';

describe('PlaneCutawaySvg', () => {
  it('renders the structural callout labels', () => {
    render(<PlaneCutawaySvg />);
    expect(screen.getByText('PASSENGER DOOR (L1)')).toBeInTheDocument();
    expect(screen.getByText('T-TAIL')).toBeInTheDocument();
    expect(screen.getByText('ENGINE · GE CF34-8C5')).toBeInTheDocument();
  });

  it('renders the wingspan dimension callout', () => {
    render(<PlaneCutawaySvg />);
    expect(screen.getByText('36.40 m')).toBeInTheDocument();
  });
});
