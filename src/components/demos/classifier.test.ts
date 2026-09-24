import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  MODEL_KB,
  buildModel,
  features,
  loadModel,
  normalize,
  predict,
  sigmoid,
  tokenize,
  type ModelFile,
} from './classifier';

const fixture: ModelFile = {
  version: 1,
  task: 'sentiment',
  labels: ['Negative', 'Positive'],
  dataset: 'fixture',
  license: 'Apache-2.0',
  nTrain: 10,
  nTest: 4,
  accuracy: 0.75,
  trainedAt: '2026-01-01',
  bias: -0.1,
  vocab: ['great', 'love', 'love it', 'good', 'not', 'not good', 'waste', 'broke', 'money'],
  weights: [1.5, 1.2, 0.5, 0.8, -0.4, -1.6, -2.0, -1.5, -0.2],
};

describe('normalize', () => {
  it('lowercases, strips accents and punctuation, and collapses spaces', () => {
    expect(normalize('  Café — GREAT!!!  Would buy again...  ')).toBe('cafe great would buy again');
  });

  it('keeps apostrophes, including curly ones, as a straight apostrophe', () => {
    expect(normalize('Don’t. It’s bad')).toBe("don't it's bad");
  });
});

describe('tokenize', () => {
  it('strips punctuation and case', () => {
    expect(tokenize('Hello, WORLD! (Fine.)')).toEqual(['hello', 'world', 'fine']);
  });

  it("keeps contractions, trims quote marks, drops stray letters but keeps 'i', 'a' and digits", () => {
    expect(tokenize("I gave it 'a' 5 x-ray; don't")).toEqual(['i', 'gave', 'it', 'a', '5', 'ray', "don't"]);
  });

  it('returns nothing for empty or punctuation-only text', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(' ?!… ')).toEqual([]);
  });
});

describe('features', () => {
  it('adds bigrams joined with a space, each feature once', () => {
    expect(features(['not', 'good', 'not', 'good'])).toEqual(['not', 'good', 'not good', 'good not']);
  });

  it('has no bigrams for a single token', () => {
    expect(features(['great'])).toEqual(['great']);
  });
});

describe('predict', () => {
  const model = buildModel(fixture);

  it('lists only features in the vocabulary, largest |weight| first', () => {
    const result = predict(model, 'It is not good, a waste of money.');
    expect(result.contributions.map((c) => c.term)).toEqual(['waste', 'not good', 'good', 'not', 'money']);
    expect(result.tokens).toEqual(['it', 'is', 'not', 'good', 'a', 'waste', 'of', 'money']);
  });

  it('has contributions that sum to logit minus bias', () => {
    for (const text of ['I love it, great value', 'Broke in a week. Not good.', 'nothing in the vocabulary']) {
      const { contributions, logit } = predict(model, text);
      const sum = contributions.reduce((s, c) => s + c.weight, 0);
      expect(Math.abs(sum - (logit - model.bias))).toBeLessThan(1e-9);
    }
  });

  it('scores a clearly positive sentence above 0.5 and a negative one below', () => {
    const positive = predict(model, 'I love it. Great, really good.');
    expect(positive.probability).toBeGreaterThan(0.5);
    expect(positive.label).toBe('Positive');

    const negative = predict(model, 'Broke after a day. Not good, a waste of money.');
    expect(negative.probability).toBeLessThan(0.5);
    expect(negative.label).toBe('Negative');
  });

  it('falls back to the bias when no feature is known', () => {
    const result = predict(model, 'zzz qqq');
    expect(result.contributions).toEqual([]);
    expect(result.logit).toBe(fixture.bias);
    expect(result.probability).toBeCloseTo(sigmoid(fixture.bias), 12);
  });
});

describe('sigmoid', () => {
  it('is stable at the extremes', () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(1000)).toBe(1);
    expect(sigmoid(-1000)).toBe(0);
  });
});

describe('loadModel', () => {
  it('indexes the vocabulary once', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 }));
    const model = await loadModel('/m.json', fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith('/m.json');
    expect(model.index.get('not good')).toBe(5);
    expect(model.maxAbsWeight).toBe(2);
  });

  it('rejects with a readable error when the response is not ok', async () => {
    const fetchImpl = vi.fn(async () => new Response('Not found', { status: 404 }));
    await expect(loadModel('/missing.json', fetchImpl)).rejects.toThrow(
      "Couldn't load the text-classifier model from /missing.json (HTTP 404).",
    );
  });

  it('rejects a malformed file', async () => {
    const broken = { ...fixture, weights: fixture.weights.slice(1) };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(broken), { status: 200 }));
    await expect(loadModel('/m.json', fetchImpl)).rejects.toThrow(/vocab and weights differ in length/);
  });

  it('rejects a body that is not JSON', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>', { status: 200 }));
    await expect(loadModel('/m.json', fetchImpl)).rejects.toThrow(/not valid JSON/);
  });
});

describe('the shipped model file', () => {
  // Vitest runs from the project root (import.meta.url isn't a file: URL under jsdom).
  const path = resolve(process.cwd(), 'public/models/text-classifier.json');

  it('is within the 400 KB budget, and the load button states its size to within 10%', () => {
    const { size } = statSync(path);
    expect(size).toBeLessThanOrEqual(400_000);
    expect(Math.abs(MODEL_KB * 1000 - size) / size).toBeLessThan(0.1);
  });

  it('is a well-formed model trained on Amazon Polarity', () => {
    const model = buildModel(JSON.parse(readFileSync(path, 'utf8')));
    expect(model.dataset).toBe('fancyzhx/amazon_polarity');
    expect(model.license).toBe('Apache-2.0');
    expect(model.labels).toEqual(['Negative', 'Positive']);
    expect(model.vocab.length).toBeGreaterThan(1000);
    expect(model.accuracy).toBeGreaterThan(0.5);
    expect(model.accuracy).toBeLessThanOrEqual(1);
  });
});
