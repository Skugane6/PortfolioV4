/**
 * The FIG. 3 demo's classifier: a small logistic-regression sentiment model
 * trained for this page by scripts/train-classifier.mjs on Amazon Polarity
 * (Apache-2.0) and run here, in the browser.
 *
 * The training script imports this very file (Node strips the types), so the
 * browser cleans, tokenizes and featurizes text exactly as training did. Keep
 * it free of TypeScript-only runtime syntax (enums, namespaces, parameter
 * properties) and of imports: Node can strip types, not transform them.
 *
 * Tokenizer decisions:
 * - Lowercase, Unicode NFKD, then drop combining marks, so "Café" is "cafe".
 * - Curly and modifier apostrophes become "'", and "'" is kept inside words,
 *   so contractions survive ("don't", "isn't" carry the negation).
 * - Everything outside [a-z0-9'] is a separator. Apostrophes at the edge of a
 *   token are trimmed ('quoted' is quoted).
 * - One-character tokens are dropped, except the words "i" and "a" and single
 *   digits, because ratings ("1 star", "5 stars") carry sentiment.
 * - No stemming and no stop-word list.
 * - Features are unigrams plus adjacent-token bigrams ("not good"), counted
 *   once each (binary presence).
 */

export const MODEL_URL = '/models/text-classifier.json';

/**
 * Size of public/models/text-classifier.json in KB (1,000 bytes), for the
 * load button. classifier.test.ts fails if it drifts more than 10% from the
 * file, so retraining can't leave a stale figure on the page.
 */
export const MODEL_KB = 206;

export interface ModelFile {
  version: 1;
  task: 'sentiment';
  /** [negative class, positive class]; index 1 is what the logit predicts. */
  labels: [string, string];
  dataset: string;
  license: string;
  nTrain: number;
  nTest: number;
  /** Held-out accuracy of the shipped (rounded) weights, 0–1. */
  accuracy: number;
  trainedAt: string;
  bias: number;
  /** Feature strings, index-aligned with `weights`. */
  vocab: string[];
  weights: number[];
}

export interface Model extends ModelFile {
  /** Feature string → position in `vocab` and `weights`. */
  index: Map<string, number>;
  /** Largest |weight| in the model: the scale for drawing weights. */
  maxAbsWeight: number;
}

export interface Contribution {
  term: string;
  weight: number;
}

export interface Prediction {
  /** labels[1] when the logit is ≥ 0, otherwise labels[0]. */
  label: string;
  /** Probability of labels[1] (Positive): the sigmoid of the logit. */
  probability: number;
  tokens: string[];
  /** Features found in the vocabulary, largest |weight| first. */
  contributions: Contribution[];
  /** bias + the sum of the contributions' weights. */
  logit: number;
}

const APOSTROPHES = /[‘’ʼ′＇]/g;
const COMBINING = /[̀-ͯ]/g;
const SEPARATORS = /[^a-z0-9']+/g;
const EDGE_APOSTROPHES = /^'+|'+$/g;
const DIGIT = /^[0-9]$/;

/** Stage 1, clean: lowercase, strip accents, and reduce everything but letters, digits and apostrophes to single spaces. */
export function normalize(text: string): string {
  return text
    .replace(APOSTROPHES, "'")
    .normalize('NFKD')
    .replace(COMBINING, '')
    .toLowerCase()
    .replace(SEPARATORS, ' ')
    .trim();
}

function keep(token: string): boolean {
  if (token.length > 1) return true;
  return token === 'i' || token === 'a' || DIGIT.test(token);
}

/** Stage 2, tokens: the cleaned text split into words (see the decisions above). */
export function tokenize(text: string): string[] {
  const clean = normalize(text);
  if (clean === '') return [];
  const tokens: string[] = [];
  for (const raw of clean.split(' ')) {
    const token = raw.replace(EDGE_APOSTROPHES, '');
    if (keep(token)) tokens.push(token);
  }
  return tokens;
}

/** Stage 3, features: unigrams then bigrams ("not good"), each once, in order of first appearance. */
export function features(tokens: string[]): string[] {
  const seen = new Set<string>(tokens);
  for (let i = 0; i + 1 < tokens.length; i++) seen.add(tokens[i] + ' ' + tokens[i + 1]);
  return [...seen];
}

export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

function fail(reason: string): never {
  throw new Error(`The text-classifier model file is malformed: ${reason}.`);
}

/** Validates a parsed model file and indexes its vocabulary once. */
export function buildModel(data: unknown): Model {
  if (typeof data !== 'object' || data === null) fail('expected a JSON object');
  const file = data as Partial<ModelFile>;
  if (file.version !== 1) fail(`unsupported version ${String(file.version)}`);
  if (!Array.isArray(file.labels) || file.labels.length !== 2) fail('expected two labels');
  if (typeof file.bias !== 'number' || !Number.isFinite(file.bias)) fail('bias is not a number');
  if (typeof file.accuracy !== 'number') fail('accuracy is not a number');
  if (typeof file.nTest !== 'number' || typeof file.nTrain !== 'number') fail('nTrain and nTest must be numbers');
  if (!Array.isArray(file.vocab) || !Array.isArray(file.weights)) fail('vocab and weights must be arrays');
  if (file.vocab.length !== file.weights.length) fail('vocab and weights differ in length');

  const index = new Map<string, number>();
  let maxAbsWeight = 0;
  file.vocab.forEach((term, i) => {
    const weight = (file.weights as unknown[])[i];
    if (typeof term !== 'string') fail(`vocab[${i}] is not a string`);
    if (typeof weight !== 'number' || !Number.isFinite(weight)) fail(`weights[${i}] is not a number`);
    index.set(term, i);
    maxAbsWeight = Math.max(maxAbsWeight, Math.abs(weight));
  });

  return { ...(file as ModelFile), index, maxAbsWeight };
}

/** Fetches and indexes the model. Rejects with a readable Error on HTTP or format errors. */
export async function loadModel(url: string = MODEL_URL, fetchImpl: typeof fetch = fetch): Promise<Model> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Couldn't load the text-classifier model from ${url} (HTTP ${response.status}).`);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`The text-classifier model at ${url} is not valid JSON.`);
  }
  return buildModel(data);
}

/** Runs the whole pipeline on one text. */
export function predict(model: Model, text: string): Prediction {
  const tokens = tokenize(text);
  const contributions: Contribution[] = [];
  let sum = 0;
  for (const term of features(tokens)) {
    const i = model.index.get(term);
    if (i === undefined) continue;
    const weight = model.weights[i];
    contributions.push({ term, weight });
    sum += weight;
  }
  contributions.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight) || (a.term < b.term ? -1 : 1));
  const logit = model.bias + sum;
  return {
    label: model.labels[logit >= 0 ? 1 : 0],
    probability: sigmoid(logit),
    tokens,
    contributions,
    logit,
  };
}
