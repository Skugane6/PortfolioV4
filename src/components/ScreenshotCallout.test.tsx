import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenshotCallout } from './ScreenshotCallout';

describe('ScreenshotCallout', () => {
  it('renders its label positioned at the given coordinates', () => {
    render(<ScreenshotCallout label="CREW AVATARS" top="32%" left="78%" />);
    const el = screen.getByText('CREW AVATARS');
    expect(el).toHaveStyle({ top: '32%', left: '78%' });
  });
});
