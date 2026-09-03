import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturedProject } from './FeaturedProject';
import { featuredProject } from '../data/projects';

describe('FeaturedProject', () => {
  it('renders the project name and problem statement from data', () => {
    render(<FeaturedProject />);
    expect(screen.getByText(featuredProject.name)).toBeInTheDocument();
    expect(screen.getByText(featuredProject.problem)).toBeInTheDocument();
  });

  it('renders the screenshot with real alt text, lazy loading, and a webp source', () => {
    render(<FeaturedProject />);
    const img = screen.getByAltText(featuredProject.screenshot.alt);
    expect(img).toHaveAttribute('src', featuredProject.screenshot.src);
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders one callout per data entry', () => {
    render(<FeaturedProject />);
    featuredProject.callouts.forEach((callout) => {
      expect(screen.getByText(callout.label)).toBeInTheDocument();
    });
  });

  it('renders the immutable-snapshot engineering decision', () => {
    render(<FeaturedProject />);
    expect(screen.getByText(featuredProject.decision.body)).toBeInTheDocument();
  });
});
