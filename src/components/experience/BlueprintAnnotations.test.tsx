import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AirframeNotes, SheetMarks, SpecBlock, AIRCRAFT } from './BlueprintAnnotations';

describe('blueprint annotations', () => {
  it('always dimensions the airframe, whatever the sheet can carry', () => {
    (['full', 'mid', 'compact'] as const).forEach((detail) => {
      const { container, unmount } = render(<AirframeNotes detail={detail} />);
      expect(container.textContent).toContain('Overall length');
      expect(container.textContent).toContain(AIRCRAFT.overall);
      unmount();
    });
  });

  // A phone can hold the dimension and nothing else; station notes and the
  // datum stamp need a plate wide enough to space them out.
  it('drops the station notes and datum stamp on a compact sheet', () => {
    const { container: wide } = render(<AirframeNotes detail="mid" />);
    expect(wide.textContent).toContain(AIRCRAFT.stations[0].sta);
    expect(wide.textContent).toContain(AIRCRAFT.datum);

    const { container: narrow } = render(<AirframeNotes detail="compact" />);
    expect(narrow.textContent).not.toContain(AIRCRAFT.stations[0].sta);
    expect(narrow.textContent).not.toContain(AIRCRAFT.datum);
  });

  it('renders no sheet furniture at all on a compact sheet', () => {
    const { container } = render(<SheetMarks detail="compact" />);
    expect(container).toBeEmptyDOMElement();
  });

  // Both notes sit in the left margin, which only the widest layout has.
  it('keeps the margin notes for the widest sheet only', () => {
    const { container: full } = render(<SheetMarks detail="full" />);
    expect(full.textContent).toContain('Direction');
    expect(full.textContent).toContain('Tomorrow');

    const { container: mid } = render(<SheetMarks detail="mid" />);
    expect(mid.textContent).not.toContain('Direction');
    expect(mid.textContent).not.toContain('Tomorrow');
    expect(mid.querySelectorAll('svg')).toHaveLength(4);
  });

  it('lists every aircraft dimension in the spec block', () => {
    render(<SpecBlock />);
    expect(screen.getByText(AIRCRAFT.model)).toBeInTheDocument();
    AIRCRAFT.dimensions.forEach(([label, value]) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  });
});
