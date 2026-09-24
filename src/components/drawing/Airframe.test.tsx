import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LazyMotion, domMax, motionValue } from 'motion/react';
import { Airframe } from './Airframe';
import { fuselageExtent } from './airframeGeometry';

const stations = [
  { id: 'a', station: 145, zone: 'Fwd fuselage', subject: 'Component Tracker' },
  { id: 'b', station: 616, zone: 'Wing box', subject: 'Aircraft Utilization Forecasting' },
];

describe('Airframe', () => {
  it('is a titled image with a named button per station', () => {
    render(<Airframe detail="full" title="Side elevation" stations={stations} />);
    expect(screen.getByRole('img', { name: 'Side elevation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Station 145, Fwd fuselage: Component Tracker' })).toHaveAttribute(
      'aria-controls',
      'callout-a',
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('reports station focus and selection', () => {
    const onActivate = vi.fn();
    const onSelect = vi.fn();
    render(<Airframe detail="full" title="t" stations={stations} onStationActivate={onActivate} onStationSelect={onSelect} />);
    const button = screen.getByRole('button', { name: /Station 616/ });
    fireEvent.focus(button);
    expect(onActivate).toHaveBeenLastCalledWith('b');
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('b');
    fireEvent.blur(button);
    expect(onActivate).toHaveBeenLastCalledWith(null);
  });

  it('leaves out construction lines on the key drawing', () => {
    const { container: key } = render(<Airframe detail="key" title="k" />);
    expect(key.querySelectorAll('.line-hidden, .line-center, .line-panel')).toHaveLength(0);
    const { container: full } = render(<Airframe detail="full" title="f" />);
    expect(full.querySelectorAll('.line-hidden').length).toBeGreaterThan(0);
  });

  it('renders plotted paths when given a plot value', () => {
    const plot = motionValue(0);
    const { container } = render(
      <LazyMotion features={domMax}>
        <Airframe detail="full" title="p" plot={plot} />
      </LazyMotion>,
    );
    expect(container.querySelectorAll('.line-object path').length).toBeGreaterThan(5);
  });
});

describe('fuselageExtent', () => {
  it('has the skin above the belly everywhere along the cabin', () => {
    for (const x of [200, 600, 1000, 1400]) {
      const { top, bottom } = fuselageExtent(x);
      expect(top).toBeLessThan(bottom);
    }
  });

  it('puts the clear sky above the fin higher than the fuselage top at the empennage', () => {
    const { top, clear } = fuselageExtent(1836);
    expect(clear).toBeLessThan(top - 100);
  });
});
