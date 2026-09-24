import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import TextDemo from './TextDemo';
import type { ModelFile } from './classifier';

const fixture: ModelFile = {
  version: 1,
  task: 'sentiment',
  labels: ['Negative', 'Positive'],
  dataset: 'fixture',
  license: 'Apache-2.0',
  nTrain: 10,
  nTest: 4000,
  accuracy: 0.876,
  trainedAt: '2026-01-01',
  bias: -0.1,
  vocab: ['great', 'love', 'love it', 'good', 'not', 'not good', 'waste', 'broke', 'money', 'worth'],
  weights: [1.5, 1.2, 0.5, 0.8, -0.4, -1.6, -2.0, -1.5, -0.2, 0.9],
};

const ok = () => new Response(JSON.stringify(fixture), { status: 200 });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ok());
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.motion;
});

const input = () => screen.getByLabelText('Type a sentence');
const result = () => document.querySelector<HTMLElement>('[aria-live="polite"]')!;

describe('TextDemo', () => {
  it('fetches nothing until the input is focused', async () => {
    render(<TextDemo />);
    expect(screen.getByRole('button', { name: /^Load the model \(≈\d+ KB\)$/ })).toBeInTheDocument();
    expect(screen.getByText(/Held-out accuracy: shown once the model loads/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.focus(input());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/models/text-classifier.json');
    expect(await screen.findByText('Held-out accuracy: 87.6% on 4,000 reviews.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Load the model/ })).not.toBeInTheDocument();

    // Focusing again doesn't refetch.
    fireEvent.blur(input());
    fireEvent.focus(input());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('prompts for text once loaded, and labels a positive sentence as it is typed', async () => {
    render(<TextDemo />);
    fireEvent.focus(input());
    await waitFor(() => expect(result()).toHaveTextContent('Type a sentence, or choose an example, to see a label.'));

    fireEvent.change(input(), { target: { value: 'I love it. Great, really good!' } });
    await waitFor(() => expect(within(result()).getByText('Positive')).toBeInTheDocument());
    // bias −0.1 + (1.2 + 0.5 + 1.5 + 0.8) = 3.9 → σ = 0.980
    expect(result()).toHaveTextContent('98.0% probability');
    expect(screen.getByText('i love it great really good')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Tokens' })).toHaveTextContent('iloveitgreatreallygood');
    expect(screen.getByText('+3.900')).toBeInTheDocument();
  });

  it('labels a negative sentence and shows its signed feature weights', async () => {
    render(<TextDemo />);
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: 'Broke in a week. Not good, a waste of money.' } });
    await waitFor(() => expect(within(result()).getByText('Negative')).toBeInTheDocument());
    const weights = screen.getByRole('list', { name: 'Largest feature weights' });
    expect(within(weights).getAllByRole('listitem')).toHaveLength(6);
    expect(weights).toHaveTextContent('waste−2.000, toward Negative');
    expect(weights).toHaveTextContent('good+0.800, toward Positive');
  });

  it('loads the model when an example is chosen', async () => {
    render(<TextDemo />);
    fireEvent.click(screen.getByRole('button', { name: /^Example: .*Worth every penny/ }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(within(result()).getByText('Positive')).toBeInTheDocument());
  });

  it('shows an error with a Retry button that retries', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('', { status: 503 }));
    render(<TextDemo />);
    fireEvent.click(screen.getByRole('button', { name: /Load the model/ }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load the model. Check your connection and try again.');

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Held-out accuracy: 87.6% on 4,000 reviews.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error when the network fails outright', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new TypeError('Failed to fetch');
    });
    render(<TextDemo />);
    fireEvent.focus(input());
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load the model.');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('draws bars without transitions under reduced motion', async () => {
    document.documentElement.dataset.motion = 'reduce';
    render(<TextDemo />);
    fireEvent.click(screen.getByRole('button', { name: /^Example: .*Worth every penny/ }));
    await waitFor(() => expect(within(result()).getByText('Positive')).toBeInTheDocument());
    const bar = screen.getByRole('list', { name: 'Largest feature weights' }).querySelector('[style]')!;
    expect(bar.className).not.toMatch(/transition/);
  });
});
