import { describe, expect, it } from 'vitest';
import { render as renderToDom, screen } from '@testing-library/react';
import { render as renderToStaticHtml } from './entry-server';
import { App } from './App';
import { sheets } from './content/sheets';

describe('App', () => {
  it('prerenders on the server without touching browser globals', () => {
    const html = renderToStaticHtml();
    expect(html).toContain('Searan Kuganesan');
    for (const sheet of sheets) expect(html).toContain(`id="${sheet.id}"`);
  });

  it('renders one h1 and a heading per sheet', () => {
    renderToDom(<App />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    for (const sheet of sheets) expect(document.getElementById(`${sheet.id}-title`)).not.toBeNull();
  });

  it('puts the skip link first and points it at main', () => {
    renderToDom(<App />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveTextContent('Skip to content');
    expect(links[0]).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).not.toBeNull();
  });
});
