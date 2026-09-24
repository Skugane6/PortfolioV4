/**
 * Modern Portfolio Theory and parametric Value at Risk on three made-up
 * assets. The inputs are illustrative, not market data, and the demo says so
 * wherever it shows a number. The math is the real thing.
 */
export interface Asset {
  name: string;
  /** Annual expected return, as a fraction. */
  expectedReturn: number;
  /** Annual volatility (standard deviation), as a fraction. */
  volatility: number;
}

export const ASSETS: Asset[] = [
  { name: 'Asset A', expectedReturn: 0.04, volatility: 0.05 },
  { name: 'Asset B', expectedReturn: 0.08, volatility: 0.15 },
  { name: 'Asset C', expectedReturn: 0.13, volatility: 0.28 },
];

/** Pairwise correlations for the illustrative assets: [A,B], [A,C], [B,C]. */
export const CORRELATION = [
  [1, 0.2, 0.1],
  [0.2, 1, 0.6],
  [0.1, 0.6, 1],
];

export const RISK_FREE = 0.02;
const Z95 = 1.645;
const TRADING_DAYS = 252;

export function covariance(assets: Asset[], corr = CORRELATION): number[][] {
  return assets.map((a, i) => assets.map((b, j) => corr[i][j] * a.volatility * b.volatility));
}

export function normalize(w: number[]): number[] {
  const sum = w.reduce((a, b) => a + b, 0);
  if (sum <= 0) return w.map(() => 1 / w.length);
  return w.map((x) => x / sum);
}

export interface PortfolioStats {
  expectedReturn: number;
  volatility: number;
  /** One-day 95% VaR as a fraction of portfolio value (a positive number is a loss). */
  var95: number;
  sharpe: number;
}

export function portfolioStats(w: number[], mu: number[], cov: number[][]): PortfolioStats {
  const expectedReturn = w.reduce((s, wi, i) => s + wi * mu[i], 0);
  let variance = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) variance += w[i] * w[j] * cov[i][j];
  const volatility = Math.sqrt(Math.max(0, variance));
  const dailyMu = expectedReturn / TRADING_DAYS;
  const dailySigma = volatility / Math.sqrt(TRADING_DAYS);
  return {
    expectedReturn,
    volatility,
    var95: Z95 * dailySigma - dailyMu,
    sharpe: volatility > 0 ? (expectedReturn - RISK_FREE) / volatility : 0,
  };
}

export interface FrontierPoint {
  weights: number[];
  expectedReturn: number;
  volatility: number;
}

/**
 * Every long-only three-asset portfolio on a grid of `step`, and the
 * efficient frontier among them: the upper-left envelope, where no other
 * portfolio earns more for the same or less volatility.
 */
export function frontier(mu: number[], cov: number[][], step = 0.02): { cloud: FrontierPoint[]; efficient: FrontierPoint[] } {
  const cloud: FrontierPoint[] = [];
  const n = Math.round(1 / step);
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n - i; j++) {
      const w = [i / n, j / n, (n - i - j) / n];
      const s = portfolioStats(w, mu, cov);
      cloud.push({ weights: w, expectedReturn: s.expectedReturn, volatility: s.volatility });
    }
  }
  const byVol = [...cloud].sort((a, b) => a.volatility - b.volatility);
  const minVar = byVol[0];
  const efficient: FrontierPoint[] = [];
  let best = -Infinity;
  for (const p of byVol) {
    if (p.expectedReturn < minVar.expectedReturn) continue;
    if (p.expectedReturn > best + 1e-9) {
      efficient.push(p);
      best = p.expectedReturn;
    }
  }
  return { cloud, efficient };
}

/**
 * Sets weight `index` to `value` and shares the remainder among the others in
 * proportion to their current weights, so the portfolio still sums to 1.
 */
export function rebalance(w: number[], index: number, value: number): number[] {
  const v = Math.min(1, Math.max(0, value));
  const rest = w.reduce((s, x, i) => (i === index ? s : s + x), 0);
  return w.map((x, i) => {
    if (i === index) return v;
    if (rest <= 0) return (1 - v) / (w.length - 1);
    return (x / rest) * (1 - v);
  });
}
