import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Projects } from './Projects';
import { projects } from '../data/projects';

const [craftTraq, risk, , eye] = projects;

/** The station button for a project, by its visible name. */
const station = (name: string) => screen.getByRole('button', { name: new RegExp(name, 'i') });

/** The active panel's heading level distinguishes it from the station rail. */
const activeName = () => screen.getByRole('heading', { level: 3 }).textContent;

/**
 * The arrow-key handler ignores keys unless the section owns the viewport, so
 * every keyboard test needs the section to measure as on-screen. Stubbed for
 * the whole suite and restored after each test; left in place it leaks into
 * whatever runs next.
 */
const IN_VIEW = {
  top: 100,
  bottom: 700,
  left: 0,
  right: 0,
  width: 0,
  height: 600,
  x: 0,
  y: 100,
  toJSON: () => ({}),
} as DOMRect;

const measure = Element.prototype.getBoundingClientRect;

/** Steps the carousel the way a keyboard user does, since there are no arrow buttons. */
const press = (key: 'ArrowLeft' | 'ArrowRight') => fireEvent.keyDown(window, { key });

describe('Projects', () => {
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = () => IN_VIEW;
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = measure;
  });

  it('lists every project on the station rail', () => {
    render(<Projects />);
    projects.forEach((project) => expect(station(project.name)).toBeInTheDocument());
  });

  it('opens on CraftTraq, marked active and live', () => {
    render(<Projects />);
    expect(activeName()).toBe(craftTraq.name);
    expect(station(craftTraq.name)).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('shows the featured panel content: tagline, stack, station, and live link', () => {
    render(<Projects />);
    expect(screen.getByText(craftTraq.tagline)).toBeInTheDocument();
    expect(screen.getByText(craftTraq.station)).toBeInTheDocument();
    craftTraq.stack.forEach((tech) => expect(screen.getByText(tech)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /VISIT LIVE SITE/ })).toHaveAttribute(
      'href',
      'https://crafttraq.com'
    );
  });

  it('uses the real CraftTraq screenshots rather than a rebuilt UI', () => {
    render(<Projects />);
    const shots = screen.getAllByRole('img');
    expect(shots.map((img) => img.getAttribute('src'))).toEqual([
      '/crafttraq-board.png',
      '/crafttraq-calendar.png',
    ]);
    shots.forEach((img) => expect(img).toHaveAccessibleName());
  });

  it('advances to the next project', () => {
    render(<Projects />);
    press('ArrowRight');
    expect(activeName()).toBe(risk.name);
    expect(station(risk.name)).toHaveAttribute('aria-current', 'true');
    expect(station(craftTraq.name)).not.toHaveAttribute('aria-current');
  });

  it('wraps backwards from the first project to the last', () => {
    render(<Projects />);
    press('ArrowLeft');
    expect(activeName()).toBe(eye.name);
    expect(station(eye.name)).toHaveAttribute('aria-current', 'true');
  });

  it('wraps forwards from the last project back to the first', () => {
    render(<Projects />);
    fireEvent.click(station(eye.name));
    expect(activeName()).toBe(eye.name);
    press('ArrowRight');
    expect(activeName()).toBe(craftTraq.name);
    expect(station(craftTraq.name)).toHaveAttribute('aria-current', 'true');
  });

  it('offers no arrow buttons: the station cards and the keys are the controls', () => {
    render(<Projects />);
    expect(screen.queryByRole('button', { name: /next project/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /previous project/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(projects.length);
  });

  it('jumps straight to a project from its station button', () => {
    render(<Projects />);
    fireEvent.click(station(eye.name));
    expect(activeName()).toBe(eye.name);
    // The eye panel replaces the CraftTraq screenshots with a drawn visual.
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getByRole('link', { name: /GITHUB REPO/ })).toHaveAttribute(
      'href',
      'https://github.com/Skugane6/eye-mouse'
    );
  });

  it('drops the LIVE badge on projects that are not live', () => {
    render(<Projects />);
    fireEvent.click(station(risk.name));
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('navigates with the arrow keys while the section is in view', () => {
    render(<Projects />);
    press('ArrowRight');
    expect(activeName()).toBe(risk.name);
    press('ArrowLeft');
    expect(activeName()).toBe(craftTraq.name);
  });

  it('ignores the arrow keys while the section is off-screen', () => {
    render(<Projects />);
    Element.prototype.getBoundingClientRect = () => ({ ...IN_VIEW, top: 5000, bottom: 5600 }) as DOMRect;
    press('ArrowRight');
    expect(activeName()).toBe(craftTraq.name);
  });

  it('keeps the station rail labelled with each project number and state', () => {
    render(<Projects />);
    const rail = station(craftTraq.name);
    expect(within(rail).getByText('01 · LIVE')).toBeInTheDocument();
    expect(within(station(risk.name)).getByText('02 · BUILD')).toBeInTheDocument();
  });
});
