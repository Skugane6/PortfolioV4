import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { App } from './App';

vi.mock('./hooks/useCanRender3D', () => ({ useCanRender3D: () => false }));

describe('App', () => {
  it('renders every section in order with the correct anchor ids', () => {
    const { container } = render(<App />);
    const ids = Array.from(container.querySelectorAll('section')).map((el) => el.id);
    expect(ids).toEqual(['hero', 'experience', 'projects', 'skills', 'contact']);
  });

  it('renders the nav rail', () => {
    const { container } = render(<App />);
    expect(container.querySelector('nav[aria-label="Section navigation"]')).not.toBeNull();
  });
});
