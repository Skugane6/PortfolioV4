import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavRail } from './NavRail';

vi.mock('../hooks/useActiveSection', () => ({
  useActiveSection: () => 'hero',
}));

describe('NavRail', () => {
  it('renders all five section links with mono section-number labels', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '01 HOME' })).toHaveAttribute('href', '#hero');
    expect(screen.getByRole('link', { name: '02 EXPERIENCE' })).toHaveAttribute('href', '#experience');
    expect(screen.getByRole('link', { name: '03 PROJECTS' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: '04 SKILLS' })).toHaveAttribute('href', '#skills');
    expect(screen.getByRole('link', { name: '05 CONTACT' })).toHaveAttribute('href', '#contact');
  });

  it('marks the active section with aria-current', () => {
    render(<NavRail />);
    expect(screen.getByRole('link', { name: '01 HOME' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '02 EXPERIENCE' })).not.toHaveAttribute('aria-current');
  });
});
