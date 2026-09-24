import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ASSETS, CORRELATION, RISK_FREE, covariance, frontier, portfolioStats, rebalance } from './risk';

const MU = ASSETS.map((a) => a.expectedReturn);
const COV = covariance(ASSETS);
const X_MAX = 0.3;
const Y_MAX = 0.15;
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

/**
 * The idea behind the Portfolio Risk Dashboard, small enough to hold: three
 * made-up assets, their efficient frontier, and a portfolio you move with the
 * weight sliders, with its return, volatility, Sharpe ratio and one-day 95%
 * Value at Risk computed live. Every figure is computed from the illustrative
 * inputs listed under the chart.
 */
export default function RiskDemo() {
  const [weights, setWeights] = useState([0.3, 0.45, 0.25]);
  const stats = portfolioStats(weights, MU, COV);
  const { cloud, efficient } = useMemo(() => frontier(MU, COV, 0.02), []);
  const idBase = useId();

  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-3 text-small text-faded">
        <span className="hold">Illustrative</span>
        Illustrative data, not market data. The math is real; the three assets are made up.
      </p>

      <Chart cloud={cloud} efficient={efficient} current={stats} />

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <fieldset>
          <legend className="lettering text-label text-faded">Weights</legend>
          <div className="mt-3 space-y-4">
            {ASSETS.map((asset, i) => {
              const id = `${idBase}-w${i}`;
              return (
                <div key={asset.name}>
                  <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-small">
                    <span className="text-blueprint">
                      {asset.name}{' '}
                      <span className="text-faded">
                        ({pct(asset.expectedReturn, 0)} return, {pct(asset.volatility, 0)} volatility)
                      </span>
                    </span>
                    <span className="figures text-blueprint">{Math.round(weights[i] * 100)}%</span>
                  </label>
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(weights[i] * 100)}
                    onChange={(e) => setWeights((w) => rebalance(w, i, Number(e.target.value) / 100))}
                    className="range mt-2 w-full"
                  />
                </div>
              );
            })}
          </div>
        </fieldset>

        <div>
          <h4 className="lettering text-label text-faded">This portfolio</h4>
          <dl className="mt-3 grid grid-cols-2 border-l border-t border-faded/50" aria-live="polite">
            {[
              ['Expected return', pct(stats.expectedReturn)],
              ['Volatility', pct(stats.volatility)],
              [`Sharpe ratio (risk-free ${pct(RISK_FREE, 0)})`, stats.sharpe.toFixed(2)],
              ['1-day VaR, 95%', pct(stats.var95, 2)],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-r border-faded/50 px-3 py-2">
                <dt className="text-label text-faded">{label}</dt>
                <dd className="figures mt-1 text-lead text-blueprint">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-label text-faded">
            VaR here is parametric: 1.645 daily standard deviations less the daily expected return, as a share of the
            portfolio&rsquo;s value.
          </p>
        </div>
      </div>

      <details className="text-small text-faded">
        <summary className="link cursor-pointer text-blueprint">Illustrative inputs</summary>
        <p className="mt-2">
          Annual expected return and volatility as listed beside each slider. Correlations: A–B{' '}
          <span className="figures">{CORRELATION[0][1]}</span>, A–C <span className="figures">{CORRELATION[0][2]}</span>, B–C{' '}
          <span className="figures">{CORRELATION[1][2]}</span>. Long-only; the frontier is traced over every portfolio on a
          2% weight grid.
        </p>
      </details>
    </div>
  );
}

interface ChartProps {
  cloud: { expectedReturn: number; volatility: number }[];
  efficient: { expectedReturn: number; volatility: number }[];
  current: { expectedReturn: number; volatility: number };
}

/** Sized to its real pixel width, so lettering stays at 13px on any screen. */
function Chart({ cloud, efficient, current }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = width < 480 ? 240 : 300;
  const m = { l: 52, r: 18, t: 14, b: 40 };
  const x = (v: number) => m.l + (v / X_MAX) * (width - m.l - m.r);
  const y = (v: number) => height - m.b - (v / Y_MAX) * (height - m.t - m.b);
  const cx = x(current.volatility);
  const cy = y(current.expectedReturn);

  return (
    <div ref={ref} className="ground w-full border border-faded/50">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={`Efficient frontier of three illustrative assets. The chosen portfolio: ${pct(current.expectedReturn)} expected return at ${pct(current.volatility)} volatility.`}
        className="block"
      >
        {[0, 0.1, 0.2, 0.3].map((t) => (
          <g key={`x${t}`}>
            <line x1={x(t)} x2={x(t)} y1={m.t} y2={height - m.b} stroke="rgb(var(--c-construction) / 0.35)" />
            <text x={x(t)} y={height - m.b + 18} textAnchor="middle" className="figures fill-faded text-label">
              {pct(t, 0)}
            </text>
          </g>
        ))}
        {[0, 0.05, 0.1, 0.15].map((t) => (
          <g key={`y${t}`}>
            <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--c-construction) / 0.35)" />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="figures fill-faded text-label">
              {pct(t, 0)}
            </text>
          </g>
        ))}
        <text x={width - m.r} y={height - 6} textAnchor="end" className="fill-faded text-label">
          Volatility
        </text>

        {cloud
          .filter((_, i) => i % 3 === 0)
          .map((p, i) => (
            <circle key={i} cx={x(p.volatility)} cy={y(p.expectedReturn)} r={1.4} fill="rgb(var(--c-construction) / 0.8)" />
          ))}
        <polyline
          points={efficient.map((p) => `${x(p.volatility)},${y(p.expectedReturn)}`).join(' ')}
          fill="none"
          stroke="rgb(var(--c-blueprint))"
          strokeWidth={2}
        />
        {ASSETS.map((a, i) => (
          <g key={a.name}>
            <rect x={x(a.volatility) - 4} y={y(a.expectedReturn) - 4} width={8} height={8} fill="rgb(var(--c-cyanotype))" stroke="rgb(var(--c-faded))" />
            <text x={x(a.volatility) + 9} y={y(a.expectedReturn) + 4} className="fill-faded font-mono text-label">
              {'ABC'[i]}
            </text>
          </g>
        ))}
        {/* The chosen portfolio, with leaders to both axes. */}
        <line x1={cx} x2={cx} y1={cy} y2={height - m.b} stroke="rgb(var(--c-redline))" strokeDasharray="6 4" />
        <line x1={m.l} x2={cx} y1={cy} y2={cy} stroke="rgb(var(--c-redline))" strokeDasharray="6 4" />
        <circle cx={cx} cy={cy} r={6} fill="rgb(var(--c-redline))" />
      </svg>
      <p className="border-t border-faded/40 px-3 py-2 text-label text-faded">
        Return (up) against volatility (across). Solid line: efficient frontier. Dots: other mixes. Red: yours.
      </p>
    </div>
  );
}
