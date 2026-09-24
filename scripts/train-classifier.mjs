#!/usr/bin/env node
/**
 * Trains the FIG. 3 demo's sentiment classifier and writes
 * public/models/text-classifier.json.
 *
 *   node scripts/train-classifier.mjs
 *
 * Data: fancyzhx/amazon_polarity (Apache-2.0), read through the Hugging Face
 * datasets-server rows API. About 30,000 training reviews are taken in blocks
 * spread across the 3.6M-row train split (so no single stretch of the file
 * dominates), plus 5,000 reviews from the test split for evaluation only. Raw
 * rows are cached under $TEMP/pf-classifier-cache/, so re-runs don't refetch.
 *
 * Features: the tokenizer and featurizer in src/components/demos/classifier.ts,
 * imported directly (Node strips its types), so training and the browser
 * tokenize identically. The vocabulary is the 12,000 unigrams and bigrams
 * with the highest document frequency among those in at least 5 training
 * reviews. Features are binary (present or not).
 *
 * Model: L2-regularised logistic regression, fitted by shuffled mini-batch
 * gradient descent with a decaying learning rate. The L2 strength is chosen
 * on a validation slice of the training reviews; the test reviews are used
 * once, at the end, to measure the shipped (rounded) weights through the
 * browser's own predict().
 *
 * Deterministic: a seeded PRNG drives every shuffle.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 22.13 strips TypeScript only behind a flag (on by default from 22.18
// and 23.6). Re-run this script with it when it's off.
if (!process.features.typescript) {
  const run = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
  process.exit(run.status ?? 1);
}

const { tokenize, features, buildModel, predict } = await import('../src/components/demos/classifier.ts');

const DATASET = 'fancyzhx/amazon_polarity';
const API = 'https://datasets-server.huggingface.co/rows';
const PAGE = 100; // The API's maximum rows per request.
const TRAIN_ROWS_TOTAL = 3_600_000;
const TEST_ROWS_TOTAL = 400_000;
const TRAIN_BLOCKS = 30; // 30 blocks × 1,000 rows = 30,000 training reviews.
const TEST_BLOCKS = 5; // 5 blocks × 1,000 rows = 5,000 test reviews.
const BLOCK = 1_000;
const CONCURRENCY = 4;

const VOCAB_SIZE = 12_000;
const MIN_DF = 5;
const EPOCHS = 8;
const BATCH = 32;
const LR0 = 0.5;
const LR_DECAY = 0.75; // Learning rate for epoch e: LR0 × LR_DECAY^e.
const L2_GRID = [1e-5, 3e-5, 1e-4, 3e-4, 1e-3];
const VALIDATION = 3_000;
const SEED = 20260924;

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public', 'models', 'text-classifier.json');
const CACHE = join(process.env.TEMP || process.env.TMPDIR || tmpdir(), 'pf-classifier-cache');

// ── Data ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 12;
const MIN_GAP_MS = 400; // Between request starts, across all workers.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A shared pacer, so the four workers together stay polite.
let nextSlot = 0;
async function pace() {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_GAP_MS;
  if (slot > now) await sleep(slot - now);
}

/** Backoff after a failure: honours Retry-After, else 5 s doubling to a 2-minute cap, with jitter. */
function backoff(attempt, retryAfter) {
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  return Math.min(120_000, 5_000 * 2 ** attempt) + Math.random() * 1_000;
}

class PermanentError extends Error {}

async function fetchPage(split, offset) {
  const file = join(CACHE, `${split}-${offset}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    // Not cached yet.
  }
  const url = `${API}?dataset=${encodeURIComponent(DATASET)}&config=amazon_polarity&split=${split}&offset=${offset}&length=${PAGE}`;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let retryAfter = null;
    try {
      await pace();
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) {
        const body = await res.json();
        const rows = body.rows.map(({ row }) => ({ label: row.label, title: row.title ?? '', content: row.content ?? '' }));
        if (rows.length !== PAGE) throw new Error(`expected ${PAGE} rows at ${split}@${offset}, got ${rows.length}`);
        await writeFile(file, JSON.stringify(rows));
        return rows;
      }
      if (res.status !== 429 && res.status < 500) throw new PermanentError(`HTTP ${res.status} for ${url}`);
      retryAfter = res.headers.get('retry-after');
      console.warn(`  ${split}@${offset}: HTTP ${res.status}, retrying`);
    } catch (error) {
      if (error instanceof PermanentError) throw error;
      console.warn(`  ${split}@${offset}: ${error.message}, retrying`);
    }
    await sleep(backoff(attempt, retryAfter));
  }
  throw new Error(`Gave up on ${url} after ${MAX_ATTEMPTS} attempts`);
}

/** Page offsets for `blocks` blocks of BLOCK rows spread evenly over `total` rows. */
function blockOffsets(total, blocks) {
  const stride = Math.floor(total / blocks);
  const offsets = [];
  for (let b = 0; b < blocks; b++) {
    const start = b * stride + Math.floor(stride / 2) - BLOCK / 2;
    for (let o = start; o < start + BLOCK; o += PAGE) offsets.push(o);
  }
  return offsets;
}

async function fetchSplit(split, offsets) {
  const pages = new Array(offsets.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < offsets.length) {
      const i = next++;
      pages[i] = await fetchPage(split, offsets[i]);
      done++;
      if (done % 50 === 0 || done === offsets.length) console.log(`  ${split}: ${done}/${offsets.length} pages`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return pages.flat();
}

const text = (row) => `${row.title}. ${row.content}`;

// ── Training ────────────────────────────────────────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildVocab(featureSets) {
  const df = new Map();
  for (const set of featureSets) for (const f of set) df.set(f, (df.get(f) ?? 0) + 1);
  const eligible = [...df].filter(([, n]) => n >= MIN_DF);
  // Highest document frequency first; ties alphabetically, so it's deterministic.
  eligible.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return { vocab: eligible.slice(0, VOCAB_SIZE).map(([f]) => f), eligible: eligible.length };
}

function encode(featureSets, index) {
  return featureSets.map((set) => Int32Array.from(set.map((f) => index.get(f)).filter((i) => i !== undefined)));
}

const sigmoid = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

/**
 * Minimises mean log loss + (l2 / 2)·|w|² (bias unregularised) by mini-batch
 * gradient descent over shuffled data.
 */
function train(X, y, dims, l2, seed) {
  const w = new Float64Array(dims);
  const grad = new Float64Array(dims);
  const touched = new Int32Array(dims);
  let b = 0;
  const random = mulberry32(seed);
  const order = Array.from(X, (_, i) => i);
  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    const lr = LR0 * LR_DECAY ** epoch;
    shuffle(order, random);
    for (let start = 0; start < order.length; start += BATCH) {
      const end = Math.min(start + BATCH, order.length);
      const n = end - start;
      let gb = 0;
      let nTouched = 0;
      for (let k = start; k < end; k++) {
        const i = order[k];
        const x = X[i];
        let z = b;
        for (let j = 0; j < x.length; j++) z += w[x[j]];
        const g = sigmoid(z) - y[i];
        gb += g;
        for (let j = 0; j < x.length; j++) {
          const f = x[j];
          if (grad[f] === 0) touched[nTouched++] = f;
          grad[f] += g;
        }
      }
      // L2 shrinks every weight each step; the data gradient touches only the batch's features.
      const shrink = 1 - lr * l2;
      if (shrink !== 1) for (let f = 0; f < dims; f++) w[f] *= shrink;
      for (let t = 0; t < nTouched; t++) {
        const f = touched[t];
        w[f] -= (lr * grad[f]) / n;
        grad[f] = 0;
      }
      b -= (lr * gb) / n;
    }
  }
  return { w, b };
}

function accuracy(X, y, { w, b }) {
  let correct = 0;
  for (let i = 0; i < X.length; i++) {
    let z = b;
    for (const f of X[i]) z += w[f];
    if ((z >= 0 ? 1 : 0) === y[i]) correct++;
  }
  return correct / X.length;
}

const round3 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? 0 : r; // No "-0" in the JSON.
};

// ── Run ─────────────────────────────────────────────────────────────────

await mkdir(CACHE, { recursive: true });
console.log(`Cache: ${CACHE}`);
console.log('Fetching rows…');
const trainRows = await fetchSplit('train', blockOffsets(TRAIN_ROWS_TOTAL, TRAIN_BLOCKS));
const testRows = await fetchSplit('test', blockOffsets(TEST_ROWS_TOTAL, TEST_BLOCKS));
const positives = (rows) => rows.filter((r) => r.label === 1).length;
console.log(`Train ${trainRows.length} reviews (${positives(trainRows)} positive), test ${testRows.length} (${positives(testRows)} positive)`);

const trainFeatures = trainRows.map((r) => features(tokenize(text(r))));
const { vocab, eligible } = buildVocab(trainFeatures);
const index = new Map(vocab.map((f, i) => [f, i]));
console.log(`Vocabulary: ${vocab.length} of ${eligible} features seen in ≥${MIN_DF} reviews`);

const X = encode(trainFeatures, index);
const y = Int8Array.from(trainRows, (r) => r.label);

// Choose the L2 strength on a validation slice of the training reviews.
const split = shuffle(Array.from(X, (_, i) => i), mulberry32(SEED));
const valIdx = split.slice(0, VALIDATION);
const fitIdx = split.slice(VALIDATION);
const pick = (idx, arr) => idx.map((i) => arr[i]);
let best = { l2: L2_GRID[0], acc: -1 };
for (const l2 of L2_GRID) {
  const model = train(pick(fitIdx, X), pick(fitIdx, y), vocab.length, l2, SEED + 1);
  const acc = accuracy(pick(valIdx, X), pick(valIdx, y), model);
  console.log(`  l2 ${l2.toExponential(0)}: validation accuracy ${(acc * 100).toFixed(2)}%`);
  if (acc > best.acc) best = { l2, acc };
}
console.log(`Chosen l2 ${best.l2.toExponential(0)}; retraining on all ${X.length} training reviews`);

const final = train(X, y, vocab.length, best.l2, SEED + 2);
console.log(`Training accuracy ${(accuracy(X, y, final) * 100).toFixed(2)}%`);

// Measure the file exactly as the browser will use it: rounded weights, run
// through classifier.ts's predict().
const file = {
  version: 1,
  task: 'sentiment',
  labels: ['Negative', 'Positive'],
  dataset: DATASET,
  license: 'Apache-2.0',
  nTrain: trainRows.length,
  nTest: testRows.length,
  accuracy: 0,
  trainedAt: new Date().toISOString().slice(0, 10),
  bias: round3(final.b),
  vocab,
  weights: Array.from(final.w, round3),
};
const shipped = buildModel(file);
let correct = 0;
for (const row of testRows) if (predict(shipped, text(row)).label === file.labels[row.label]) correct++;
const measured = correct / testRows.length;
file.accuracy = Math.round(measured * 1000) / 1000;
console.log(`Held-out test accuracy (shipped weights): ${correct}/${testRows.length} = ${(measured * 100).toFixed(2)}%`);

await mkdir(join(ROOT, 'public', 'models'), { recursive: true });
await writeFile(OUT, JSON.stringify(file));
const { size } = await stat(OUT);
console.log(`Wrote ${OUT} (${size} bytes, ${(size / 1000).toFixed(1)} KB)`);
if (size > 400_000) {
  console.error('The model file is over the 400 KB budget.');
  process.exit(1);
}
