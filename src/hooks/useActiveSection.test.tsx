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

// IntersectionObserver reports a rect for every entry, intersecting or not, and
// the hook has to be able to order an entry that is *not* in the current batch —
// so the fixture carries a top for both states.
function entry(id: string, isIntersecting: boolean, top: number): IntersectionObserverEntry {
  return {
    isIntersecting,
    boundingClientRect: { top } as DOMRectReadOnly,
    target: document.getElementById(id) as Element,
  } as IntersectionObserverEntry;
}

function fire(...entries: IntersectionObserverEntry[]) {
  act(() => {
    observedCallback(entries, {} as IntersectionObserver);
  });
}

function TestHost({ ids }: { ids: string[] }) {
  const active = useActiveSection(ids);
  return <div data-testid="active">{active}</div>;
}

const active = () => screen.getByTestId('active').textContent;

describe('useActiveSection', () => {
  beforeEach(() => {
    // @ts-expect-error test double
    global.IntersectionObserver = CapturingIntersectionObserver;
    document.body.innerHTML =
      '<div id="hero"></div><div id="work"></div><div id="projects"></div><div id="contact"></div>';
  });

  it('defaults to the first section id', () => {
    render(<TestHost ids={['hero', 'work']} />);
    expect(active()).toBe('hero');
  });

  it('updates to the topmost intersecting section', () => {
    render(<TestHost ids={['hero', 'work']} />);
    fire(entry('work', true, 50));
    expect(active()).toBe('work');
  });

  it('promotes the next section when the section above it leaves in an exit-only batch', () => {
    // Real batch sequence captured from the running page at the
    // experience -> projects handoff: the incoming section enters while the
    // outgoing one is still in the band (so the outgoing one is topmost and
    // wins), and the outgoing one then leaves *alone* in its own batch. The
    // incoming section's state never changes again, so it is absent from that
    // second batch — the hook must remember it is still intersecting.
    render(<TestHost ids={['hero', 'work', 'projects']} />);
    fire(entry('work', true, 100), entry('projects', true, 800));
    expect(active()).toBe('work');

    fire(entry('work', false, -400));
    expect(active()).toBe('projects');
  });

  it('keeps the last known section when every section leaves the band', () => {
    render(<TestHost ids={['hero', 'work']} />);
    fire(entry('work', true, 100));
    fire(entry('work', false, -400));
    expect(active()).toBe('work');
  });

  it('ignores a stale section that has already left the band', () => {
    render(<TestHost ids={['hero', 'work', 'projects']} />);
    fire(entry('work', true, 100), entry('projects', true, 800));
    fire(entry('work', false, -400));
    // 'work' is out; re-reporting projects must not resurrect it.
    fire(entry('projects', true, 100));
    expect(active()).toBe('projects');
  });
});
