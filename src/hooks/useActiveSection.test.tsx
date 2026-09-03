import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useActiveSection } from './useActiveSection';

let observedCallback: IntersectionObserverCallback;

class CapturingIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(callback: IntersectionObserverCallback) {
    observedCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function TestHost({ ids }: { ids: string[] }) {
  const active = useActiveSection(ids);
  return <div data-testid="active">{active}</div>;
}

describe('useActiveSection', () => {
  beforeEach(() => {
    // @ts-expect-error test double
    global.IntersectionObserver = CapturingIntersectionObserver;
    document.body.innerHTML = '<div id="hero"></div><div id="work"></div>';
  });

  it('defaults to the first section id', () => {
    render(<TestHost ids={['hero', 'work']} />);
    expect(screen.getByTestId('active').textContent).toBe('hero');
  });

  it('updates to the topmost intersecting section', () => {
    render(<TestHost ids={['hero', 'work']} />);
    act(() => {
      observedCallback(
        [
          {
            isIntersecting: true,
            boundingClientRect: { top: 50 } as DOMRectReadOnly,
            target: document.getElementById('work') as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });
    expect(screen.getByTestId('active').textContent).toBe('work');
  });
});
