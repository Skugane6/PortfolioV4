import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Projects } from './Projects';
import { featuredProject, secondaryProjects } from '../data/projects';

describe('Projects', () => {
  it('renders every slide name', () => {
    render(<Projects />);
    expect(screen.getByText(featuredProject.name)).toBeInTheDocument();
    secondaryProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  it('starts on the featured slide with Previous disabled and Next enabled', () => {
    render(<Projects />);
    expect(screen.getByRole('button', { name: 'Previous project' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next project' })).not.toBeDisabled();
    expect(screen.getByText('01 / 04')).toBeInTheDocument();
  });

  it('renders the CraftTraq case study details on the featured slide', () => {
    render(<Projects />);
    expect(screen.getByText(featuredProject.problem)).toBeInTheDocument();
    expect(screen.getByText(featuredProject.decision.body)).toBeInTheDocument();
  });

  it('moves to the next slide and updates the counter and active chip', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: 'Next project' }));
    expect(screen.getByText('02 / 04')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /02 PORTFOLIO RISK DASHBOARD/ })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('jumps to a slide when its chip is clicked, and disables Next at the last slide', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: /04 EYE-MOUSE/ }));
    expect(screen.getByText('04 / 04')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled();
  });

  it('navigates with the right arrow key while the section is in view', () => {
    render(<Projects />);
    const rect: DOMRect = {
      top: 100,
      bottom: 700,
      left: 0,
      right: 0,
      width: 0,
      height: 600,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    };
    Element.prototype.getBoundingClientRect = () => rect;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('02 / 04')).toBeInTheDocument();
  });
});
