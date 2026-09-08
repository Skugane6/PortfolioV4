import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Projects } from './Projects';
import { projects } from '../data/projects';

const [craftTraq, risk, , eye] = projects;

/** The station button for a project, by its visible name. */
const station = (name: string) => screen.getByRole('button', { name: new RegExp(name, 'i') });

/** The active panel's heading level distinguishes it from the station rail. */
const activeName = () => screen.getByRole('heading', { level: 3 }).textContent;

describe('Projects', () => {
  it('lists every project on the station rail', () => {
    render(<Projects />);
    projects.forEach((project) => expect(station(project.name)).toBeInTheDocument());
  });

  it('opens on CraftTraq, marked active and live', () => {
    render(<Projects />);
    expect(activeName()).toBe(craftTraq.name);
    expect(station(craftTraq.name)).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('01 / 04')).toBeInTheDocument();
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

  it('advances to the next project and updates the counter', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: 'Next project' }));
    expect(activeName()).toBe(risk.name);
    expect(screen.getByText('02 / 04')).toBeInTheDocument();
    expect(station(risk.name)).toHaveAttribute('aria-current', 'true');
  });

  it('wraps backwards from the first project to the last', () => {
    render(<Projects />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous project' }));
    expect(activeName()).toBe(eye.name);
    expect(screen.getByText('04 / 04')).toBeInTheDocument();
  });

  it('wraps forwards from the last project back to the first', () => {
    render(<Projects />);
    fireEvent.click(station(eye.name));
    expect(screen.getByText('04 / 04')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next project' }));
    expect(activeName()).toBe(craftTraq.name);
    expect(screen.getByText('01 / 04')).toBeInTheDocument();
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
    const rect: DOMRect = {
      top: 100,
      bottom: 700,
      left: 0,
      right: 0,
      width: 0,
      height: 600,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    };
    Element.prototype.getBoundingClientRect = () => rect;
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('02 / 04')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('01 / 04')).toBeInTheDocument();
  });

  it('keeps the station rail labelled with each project number and state', () => {
    render(<Projects />);
    const rail = station(craftTraq.name);
    expect(within(rail).getByText('01 · LIVE')).toBeInTheDocument();
    expect(within(station(risk.name)).getByText('02 · BUILD')).toBeInTheDocument();
  });
});
