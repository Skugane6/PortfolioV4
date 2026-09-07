import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { WakeField, type WakeHandle } from './WakeField';

// jsdom has no 2D canvas; the component has to survive that (and so does any
// browser that refuses the context), so hand it a no-op stub.
function stubCanvas() {
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    globalCompositeOperation: '',
    lineCap: '',
    lineWidth: 0,
    strokeStyle: '',
  };
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;
  return ctx;
}

describe('WakeField', () => {
  let raf: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stubCanvas();
    // Assigned rather than spied: vi.spyOn's inferred MockInstance type does
    // not line up with rAF's overloaded signature under tsc.
    raf = vi.fn(() => 1);
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders a decorative canvas that is hidden from assistive tech', () => {
    const { container } = render(<WakeField planeRef={createRef()} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  // The survey is ~80% of the section. Running a per-frame particle loop
  // through all of it for a wake that has not started yet is pure waste.
  it('stays idle while the airframe is still on station', () => {
    const ref = createRef<WakeHandle>();
    render(<WakeField ref={ref} planeRef={createRef()} />);
    raf.mockClear();
    ref.current?.pump(0);
    expect(raf).not.toHaveBeenCalled();
  });

  // Thrust leads travel, so the engines are already making wake on the frame
  // the airframe has yet to move. The loop has to wake on thrust, not on run.
  it('starts drawing as soon as the engines spool up', () => {
    const ref = createRef<WakeHandle>();
    render(<WakeField ref={ref} planeRef={createRef()} />);
    raf.mockClear();
    ref.current?.pump(0.2);
    expect(raf).toHaveBeenCalled();
  });

  it('does not stack a second loop when pumped again mid-run', () => {
    const ref = createRef<WakeHandle>();
    render(<WakeField ref={ref} planeRef={createRef()} />);
    raf.mockClear();
    ref.current?.pump(0.3);
    ref.current?.pump(0.45);
    ref.current?.pump(0.55);
    expect(raf).toHaveBeenCalledTimes(1);
  });
});
