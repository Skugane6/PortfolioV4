import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { Cursor } from './Cursor';

const realMatchMedia = window.matchMedia;

/**
 * jsdom's stub in test/setup.ts answers `false` to everything, which is the
 * coarse-pointer case. This swaps in a matcher that reports a mouse while
 * still declining prefers-reduced-motion.
 */
function usePointer(kind: 'fine' | 'coarse') {
  window.matchMedia = ((query: string) => ({
    matches: query.includes(`pointer: ${kind}`),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

describe('Cursor', () => {
  it('renders nothing on a touch device', () => {
    usePointer('coarse');
    const { container } = render(<Cursor />);
    expect(container).toBeEmptyDOMElement();
  });

  it('never hides the native cursor', () => {
    usePointer('fine');
    const { container } = render(<Cursor />);
    // The torch travels with the OS pointer rather than standing in for it,
    // so nothing here may set `cursor: none` — not on the root, not on the
    // body, not on the overlay. An earlier revision hid it; this is the guard
    // against that coming back.
    expect(document.documentElement.className).not.toMatch(/cursor/);
    expect(document.body.style.cursor).toBe('');
    expect(container.innerHTML).not.toContain('cursor: none');
  });

  it('cannot intercept a click or be read out', () => {
    usePointer('fine');
    const { container } = render(<Cursor />);
    const layer = container.firstElementChild;
    // It sits above the whole page at z-60, so both of these are load-bearing:
    // it is decoration, and it must never swallow a press meant for a link.
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveClass('pointer-events-none');
  });

  it('lifts the grid off images rather than ruling lines across them', () => {
    usePointer('fine');
    const { container } = render(<Cursor />);
    const layer = container.firstElementChild as HTMLElement;

    const image = document.createElement('img');
    document.body.appendChild(image);
    // A plain Event is enough: the handler reads event.target and nothing
    // else, and jsdom has no PointerEvent constructor.
    image.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(layer.style.getPropertyValue('--torch-grid')).toBe('0');

    // ...and puts it back on the way out. `screen` over a photograph washes
    // it out, so the lamp itself dims over media too rather than going dark.
    document.body.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(layer.style.getPropertyValue('--torch-grid')).toBe('1');
    expect(layer.style.getPropertyValue('--torch-glow')).toBe('1');

    image.remove();
  });

  it('starts dark and only lights once the pointer has been seen', () => {
    usePointer('fine');
    const { container } = render(<Cursor />);
    // Rendering at opacity 0 is what stops the torch appearing at a stale
    // corner of the screen before the pointer has moved at all.
    expect((container.firstElementChild as HTMLElement).style.opacity).toBe('0');
  });
});
