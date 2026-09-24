import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotionPref } from '../../lib/motion';
import { MODEL_KB, features, loadModel, normalize, predict, type Contribution, type Model } from './classifier';

type Status = 'idle' | 'loading' | 'ready' | 'error';

/** Made-up review sentences, offered as examples. */
const EXAMPLES = [
  'Arrived early, fits perfectly, and the battery lasts all week. Worth every penny.',
  'Stopped working after two days and the seller never replied. Waste of money.',
  'The sound is great, but it broke within a month.',
];

const DEBOUNCE_MS = 120;
const TOP_FEATURES = 6;
const MAX_TOKENS_SHOWN = 60;
const DATASET_URL = 'https://huggingface.co/datasets/fancyzhx/amazon_polarity';

/** Signed, three decimals, with a true minus sign. */
function signed(value: number): string {
  const text = Math.abs(value).toFixed(3);
  if (text === '0.000') return text;
  return (value < 0 ? '−' : '+') + text;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * FIG. 3's demo: a sentence typed here passes through clean → tokens →
 * features → model → label, using a small logistic-regression model trained
 * for this page (scripts/train-classifier.mjs). The model file loads only
 * when the visitor focuses the input, picks an example or asks for it.
 */
export default function TextDemo() {
  const reduced = useReducedMotionPref();
  const inputId = useId();
  const hintId = useId();
  const examplesId = useId();

  const [status, setStatus] = useState<Status>('idle');
  const [model, setModel] = useState<Model | null>(null);
  const [text, setText] = useState('');
  const [settled, setSettled] = useState('');

  const inflight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const ensureModel = useCallback(() => {
    if (model || inflight.current) return;
    inflight.current = true;
    setStatus('loading');
    loadModel().then(
      (loaded) => {
        inflight.current = false;
        if (!mounted.current) return;
        setModel(loaded);
        setStatus('ready');
      },
      () => {
        inflight.current = false;
        if (mounted.current) setStatus('error');
      },
    );
  }, [model]);

  // The pipeline follows the input ~120 ms behind, so typing stays smooth.
  useEffect(() => {
    if (text === settled) return;
    const timer = window.setTimeout(() => setSettled(text), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, settled]);

  const chooseExample = (example: string) => {
    setText(example);
    setSettled(example);
    ensureModel();
  };

  const hasText = settled.trim() !== '';
  const prediction = useMemo(() => (model && hasText ? predict(model, settled) : null), [model, settled, hasText]);
  // Text with no words in it (only punctuation, say) is treated as empty.
  const result = prediction && prediction.tokens.length > 0 ? prediction : null;
  const cleaned = useMemo(() => normalize(settled), [settled]);
  const featureCount = result ? features(result.tokens).length : 0;
  const bars = reduced ? '' : 'transition-transform duration-base ease-settle';

  const labelProbability = result ? (result.logit >= 0 ? result.probability : 1 - result.probability) : 0;
  const negative = result ? result.logit < 0 : false;

  // What the label stage (the live region) says when there's no label to show.
  let waiting: string;
  if (status === 'idle') waiting = 'The model hasn’t loaded yet.';
  else if (status === 'loading') waiting = 'Loading the model…';
  else if (status === 'error') waiting = 'No model loaded.';
  else if (hasText) waiting = 'No words to classify yet. Type a sentence, or choose an example.';
  else waiting = 'Type a sentence, or choose an example, to see a label.';

  return (
    <div className="w-full max-w-[720px] text-blueprint">
      <p className="border-l-2 border-faded/60 pl-3 text-small text-faded">
        This demo runs a small logistic-regression model trained for this page on public product reviews (
        <a className="link text-blueprint" href={DATASET_URL} target="_blank" rel="noopener noreferrer">
          Amazon Polarity<span className="sr-only"> (opens in new tab)</span>
        </a>
        , Apache-2.0), entirely in your browser. It shows the same pipeline stages, not the project’s BERT ensemble.{' '}
        {model ? (
          <span className="figures">
            Held-out accuracy: {(model.accuracy * 100).toFixed(1)}% on {model.nTest.toLocaleString('en-US')} reviews.
          </span>
        ) : (
          'Held-out accuracy: shown once the model loads, read from the model file.'
        )}{' '}
        Nothing you type is sent anywhere.
      </p>

      <div className="mt-6">
        <label htmlFor={inputId} className="block text-small font-medium text-blueprint">
          Type a sentence
        </label>
        <input
          id={inputId}
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={ensureModel}
          maxLength={400}
          autoComplete="off"
          aria-describedby={hintId}
          placeholder="e.g. The strap broke after a week"
          className="ground mt-2 block min-h-[48px] w-full border-2 border-faded/70 px-3 text-body text-blueprint placeholder:text-faded hover:border-blueprint"
        />
        <p id={hintId} className="mt-2 text-label text-faded">
          Classified as you type. The model file downloads when you focus this field, choose an example or press Load.
        </p>
      </div>

      <div role="group" aria-labelledby={examplesId} className="mt-5">
        <p id={examplesId} className="text-small text-faded">
          Or try an example (made-up reviews):
        </p>
        <ul className="mt-2 grid gap-2">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => chooseExample(example)}
                className="ground block min-h-[44px] w-full border border-faded/60 px-3 py-2 text-left text-small text-blueprint transition-colors duration-quick hover:border-blueprint"
              >
                <span className="sr-only">Example: </span>“{example}”
              </button>
            </li>
          ))}
        </ul>
      </div>

      {status === 'idle' && (
        <button type="button" onClick={ensureModel} className="btn-secondary mt-5">
          Load the model (≈{MODEL_KB} KB)
        </button>
      )}

      {status === 'loading' && <p className="mt-5 text-small text-faded">Loading the model (≈{MODEL_KB} KB)…</p>}

      {status === 'error' && (
        <div role="alert" className="mt-5 border-2 border-redline p-4">
          <p className="text-small text-blueprint">Couldn’t load the model. Check your connection and try again.</p>
          <button type="button" onClick={ensureModel} className="btn-secondary mt-3">
            Retry
          </button>
        </div>
      )}

      <ol aria-label="Pipeline stages" className="mt-8">
        <Stage n={1} name="Clean" caption="Lowercase, accents and punctuation removed.">
          {result ? (
            <p className="ground break-words border border-faded/40 px-3 py-2 text-small text-blueprint">
              {cleaned}
            </p>
          ) : (
            <Pending ready={status === 'ready'} />
          )}
        </Stage>

        <Stage n={2} name="Tokens" caption="The cleaned text split into words.">
          {result ? (
            <>
              <p className="figures text-label text-faded">{result.tokens.length} tokens</p>
              <ul aria-label="Tokens" className="mt-2 flex flex-wrap gap-1.5">
                {result.tokens.slice(0, MAX_TOKENS_SHOWN).map((token, i) => (
                  <li key={`${i}-${token}`} className="ground border border-faded/60 px-1.5 py-0.5 font-mono text-data text-blueprint">
                    {token}
                  </li>
                ))}
                {result.tokens.length > MAX_TOKENS_SHOWN && (
                  <li className="px-1.5 py-0.5 text-label text-faded">
                    and {result.tokens.length - MAX_TOKENS_SHOWN} more
                  </li>
                )}
              </ul>
            </>
          ) : (
            <Pending ready={status === 'ready'} />
          )}
        </Stage>

        <Stage n={3} name="Features" caption="Words and word pairs, each weighed by the model. Largest weights first.">
          {result && model ? (
            <Features
              contributions={result.contributions}
              featureCount={featureCount}
              vocabSize={model.vocab.length}
              scale={model.maxAbsWeight}
              barClass={bars}
            />
          ) : (
            <Pending ready={status === 'ready'} />
          )}
        </Stage>

        <Stage n={4} name="Model" caption="logit = bias + Σ weights; probability = σ(logit), the logistic function.">
          {result && model ? (
            <dl className="figures ground grid max-w-sm grid-cols-[1fr_auto] gap-x-6 border border-faded/40 px-3 py-2 text-data">
              <dt className="text-faded">Bias</dt>
              <dd className="text-right">{signed(model.bias)}</dd>
              <dt className="text-faded">
                Σ weights ({result.contributions.length} feature{result.contributions.length === 1 ? '' : 's'})
              </dt>
              <dd className="text-right">{signed(result.logit - model.bias)}</dd>
              <dt className="mt-1 border-t border-faded/60 pt-1 text-faded">Logit</dt>
              <dd className="mt-1 border-t border-faded/60 pt-1 text-right">{signed(result.logit)}</dd>
              <dt className="text-faded">Probability positive</dt>
              <dd className="text-right">{result.probability.toFixed(3)}</dd>
            </dl>
          ) : (
            <Pending ready={status === 'ready'} />
          )}
        </Stage>

        <Stage n={5} name="Label" caption="Positive when the logit is 0 or more, otherwise Negative." last>
          <p aria-live="polite" aria-atomic="true" className="text-small text-faded">
            {result ? (
              <>
                <span className={`w-narrow mr-3 text-heading font-semibold ${negative ? 'text-redline' : 'text-blueprint'}`}>
                  {result.label}
                </span>
                <span className="figures text-body text-blueprint">{percent(labelProbability)}</span>{' '}
                <span>probability</span>
              </>
            ) : (
              waiting
            )}
          </p>
          {result && (
            <div aria-hidden="true" className="mt-3 h-3 max-w-sm overflow-hidden border border-faded/60">
              <div
                className={`h-full w-full origin-left ${negative ? 'bg-redline' : 'bg-blueprint'} ${bars}`}
                style={{ transform: `scaleX(${labelProbability})` }}
              />
            </div>
          )}
        </Stage>
      </ol>
    </div>
  );
}

function Pending({ ready }: { ready: boolean }) {
  return <p className="text-small text-faded">{ready ? 'Waiting for text.' : 'Waiting for the model.'}</p>;
}

interface StageProps {
  n: number;
  name: string;
  caption: string;
  last?: boolean;
  children: ReactNode;
}

/** One stage of the process drawing: its number on the flow line, its name, what it does, and its output. */
function Stage({ n, name, caption, last = false, children }: StageProps) {
  return (
    <li className={`relative pl-12 ${last ? '' : 'pb-7'}`}>
      {!last && (
        <>
          <span aria-hidden="true" className="absolute bottom-1 left-4 top-8 border-l border-construction" />
          <svg aria-hidden="true" width="10" height="6" viewBox="0 0 10 6" className="absolute bottom-1 left-[11.5px]">
            <path d="M0.5 0.5 L5 5.5 L9.5 0.5" fill="none" stroke="rgb(var(--c-construction))" strokeWidth="1" />
          </svg>
        </>
      )}
      <span
        aria-hidden="true"
        className="ground absolute left-0 top-0 flex h-8 w-8 items-center justify-center border-2 border-faded/70 font-mono text-data text-blueprint"
      >
        {n}
      </span>
      <p className="flex min-h-8 flex-wrap items-baseline gap-x-3 pt-1.5">
        <span className="lettering w-narrow text-label font-medium text-blueprint">
          <span className="sr-only">Stage {n}: </span>
          {name}
        </span>
        <span className="text-label text-faded">{caption}</span>
      </p>
      <div className="mt-2">{children}</div>
    </li>
  );
}

interface FeaturesProps {
  contributions: Contribution[];
  featureCount: number;
  vocabSize: number;
  scale: number;
  barClass: string;
}

/*
 * Rows share one grid: from 640px, term | bar | weight on a line, with the
 * bar's centre line (weight 0) aligned down the list; below that, term and
 * weight share a line and the bar runs full width underneath.
 */
const ROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem]';

function Features({ contributions, featureCount, vocabSize, scale, barClass }: FeaturesProps) {
  const top = contributions.slice(0, TOP_FEATURES);
  const known = contributions.length;
  return (
    <>
      <p className="figures text-label text-faded">
        Known to the model: {known} of {featureCount} (its vocabulary has {vocabSize.toLocaleString('en-US')} words and
        pairs).{known > TOP_FEATURES && ` The ${TOP_FEATURES} largest are drawn.`}
      </p>
      {known === 0 ? (
        <p className="mt-2 text-small text-faded">None of them are known to the model, so only the bias counts.</p>
      ) : (
        <div className="max-w-xl">
          <div aria-hidden="true" className={`${ROW} mt-3 text-label text-faded`}>
            <span className="hidden sm:block" />
            <span className="col-span-2 flex justify-between sm:col-span-1">
              <span>← Negative</span>
              <span>Positive →</span>
            </span>
            <span className="hidden sm:block" />
          </div>
          <ul aria-label="Largest feature weights" className="mt-1 space-y-2 sm:space-y-1.5">
            {top.map(({ term, weight }) => {
              const size = scale > 0 ? Math.min(1, Math.abs(weight) / scale) : 0;
              const down = weight < 0;
              return (
                <li key={term} className={ROW}>
                  <span className="order-1 break-all font-mono text-data text-blueprint">{term}</span>
                  <span
                    className={`figures order-2 text-right text-data sm:order-3 ${down ? 'text-redline' : 'text-blueprint'}`}
                  >
                    {signed(weight)}
                    <span className="sr-only">, toward {down ? 'Negative' : 'Positive'}</span>
                  </span>
                  <span aria-hidden="true" className="relative order-3 col-span-2 mt-1 h-2 sm:order-2 sm:col-span-1 sm:mt-0">
                    <span className="absolute -bottom-1 -top-1 left-1/2 border-l border-faded/70" />
                    <span
                      className={`absolute top-0 h-full w-1/2 ${down ? 'right-1/2 origin-right bg-redline' : 'left-1/2 origin-left bg-faded'} ${barClass}`}
                      style={{ transform: `scaleX(${size})` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
