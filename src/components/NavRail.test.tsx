import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavRail } from './NavRail';

vi.mock('../hooks/useActiveSection', () => ({
  useActiveSection: () => 'experience',
}));

describe('NavRail', () => {
  it('renders all four section links with mono section-number labels', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '01 EXPERIENCE' })).toHaveAttribute('href', '#experience');
    expect(screen.getByRole('link', { name: '02 PROJECTS' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: '03 SKILLS' })).toHaveAttribute('href', '#skills');
    expect(screen.getByRole('link', { name: '04 CONTACT' })).toHaveAttribute('href', '#contact');
  });

  it('marks the active section with aria-current', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '01 EXPERIENCE' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '02 PROJECTS' })).not.toHaveAttribute('aria-current');
  });
});
