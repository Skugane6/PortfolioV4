import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Contact } from './Contact';

const EMAIL = 'searan.kuganesan4@gmail.com';

describe('Contact', () => {
  it('renders a mailto link to the real email address', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: /send email/i })).toHaveAttribute('href', `mailto:${EMAIL}`);
  });

  it('shows the address itself, so the mailto link is not the only way to get it', () => {
    render(<Contact />);
    expect(screen.getByText(EMAIL)).toBeInTheDocument();
  });

  it('renders real GitHub, LinkedIn, and CraftTraq links', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/skugane6'
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/searan-kuganesan'
    );
    expect(screen.getByRole('link', { name: /crafttraq/i })).toHaveAttribute('href', 'https://crafttraq.com');
  });

  it('opens the off-site profiles in a new tab without leaking the referrer window', () => {
    render(<Contact />);
    ['github', 'linkedin', 'crafttraq'].forEach((name) => {
      const link = screen.getByRole('link', { name: new RegExp(name, 'i') });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });
  });

  it('gives every channel an icon, and hides those icons from assistive tech', () => {
    const { container } = render(<Contact />);
    // One mark per channel: email plus the three profiles.
    expect(container.querySelectorAll('.contact-mark')).toHaveLength(4);
    container.querySelectorAll('.contact-mark').forEach((mark) => {
      expect(mark.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('keeps the link text as each channel’s name, not the icon alone', () => {
    render(<Contact />);
    // An icon-only link would leave these accessible names empty.
    expect(screen.getByRole('link', { name: /github/i })).toHaveAccessibleName(/GitHub/);
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAccessibleName(/LinkedIn/);
  });

  describe('copy control', () => {
    const writeText = vi.fn(() => Promise.resolve());

    beforeEach(() => {
      writeText.mockClear();
      Object.assign(navigator, { clipboard: { writeText } });
    });

    it('copies the address and confirms it', async () => {
      render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /copy address/i }));

      expect(writeText).toHaveBeenCalledWith(EMAIL);
      await waitFor(() => expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument());
    });

    it('leaves the control alone when the browser refuses clipboard access', async () => {
      writeText.mockImplementationOnce(() => Promise.reject(new Error('denied')));
      render(<Contact />);

      fireEvent.click(screen.getByRole('button', { name: /copy address/i }));
      await waitFor(() => expect(writeText).toHaveBeenCalled());

      // The address is still on screen to select by hand, so a refusal needs no
      // error state — the button just never claims success.
      expect(screen.getByText(EMAIL)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /copied/i })).toBeNull();
    });
  });

  it('drops the old headline', () => {
    render(<Contact />);
    expect(screen.queryByText(/fastest way to reach me/i)).toBeNull();
  });
});
