import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NavRail } from './NavRail';
import { animateScrollTo } from '../utils/smoothScroll';

vi.mock('../hooks/useActiveSection', () => ({
  useActiveSection: () => 'hero',
}));

vi.mock('../utils/smoothScroll', () => ({
  animateScrollTo: vi.fn(),
}));

const animateScrollToMock = vi.mocked(animateScrollTo);

// Hand back a tween whose completion this test controls.
function stubAnimation() {
  let settle!: () => void;
  const finished = new Promise<void>((resolve) => {
    settle = resolve;
  });
  const cancel = vi.fn();
  animateScrollToMock.mockReturnValue({ cancel, finished });
  return { settle, cancel };
}

describe('NavRail', () => {
  beforeEach(() => {
    animateScrollToMock.mockReset();
    stubAnimation();
    document.body.innerHTML =
      '<div id="hero"></div><div id="experience"></div><div id="projects"></div>' +
      '<div id="skills"></div><div id="contact"></div>';
    history.replaceState(null, '', '/');
  });

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

  it('animates to the section instead of letting the browser jump', () => {
    render(<NavRail />);
    const link = screen.getByRole('link', { name: '03 PROJECTS' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    act(() => {
      link.dispatchEvent(event);
    });
    expect(animateScrollToMock).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('still updates the URL hash so the destination stays shareable', () => {
    render(<NavRail />);
    act(() => {
      screen.getByRole('link', { name: '04 SKILLS' }).click();
    });
    expect(window.location.hash).toBe('#skills');
  });

  it('holds the highlight on the destination while the scroll is in flight', async () => {
    const { settle } = stubAnimation();
    render(<NavRail />);
    act(() => {
      screen.getByRole('link', { name: '05 CONTACT' }).click();
    });
    // Observer still says 'hero', but the rail must show where we are going.
    expect(screen.getByRole('link', { name: '05 CONTACT' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '01 HOME' })).not.toHaveAttribute('aria-current');

    await act(async () => {
      settle();
    });
    // Journey over: the observer is back in charge.
    expect(screen.getByRole('link', { name: '01 HOME' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: '05 CONTACT' })).not.toHaveAttribute('aria-current');
  });

  it('leaves modified clicks to the browser so open-in-new-tab still works', () => {
    render(<NavRail />);
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      metaKey: true,
    });
    act(() => {
      screen.getByRole('link', { name: '03 PROJECTS' }).dispatchEvent(event);
    });
    expect(animateScrollToMock).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('cancels an in-flight scroll when another section is clicked', () => {
    const { cancel } = stubAnimation();
    render(<NavRail />);
    act(() => {
      screen.getByRole('link', { name: '03 PROJECTS' }).click();
    });
    act(() => {
      screen.getByRole('link', { name: '05 CONTACT' }).click();
    });
    expect(cancel).toHaveBeenCalled();
  });
});
