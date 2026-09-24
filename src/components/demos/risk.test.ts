import { describe, expect, it } from 'vitest';
import { ASSETS, covariance, frontier, normalize, portfolioStats, rebalance } from './risk';

const cov = covariance(ASSETS);
const mu = ASSETS.map((a) => a.expectedReturn);

describe('risk math (illustrative inputs)', () => {
  it('normalizes weights to sum to 1', () => {
    expect(normalize([1, 1, 2])).toEqual([0.25, 0.25, 0.5]);
    expect(normalize([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('a single-asset portfolio has that asset’s return and volatility', () => {
    const s = portfolioStats([0, 1, 0], mu, cov);
    expect(s.expectedReturn).toBeCloseTo(ASSETS[1].expectedReturn, 10);
    expect(s.volatility).toBeCloseTo(ASSETS[1].volatility, 10);
  });

  it('computes one-day parametric VaR at 95% from the annual figures', () => {
    const s = portfolioStats([0.3, 0.4, 0.3], mu, cov);
    const dailyMu = s.expectedReturn / 252;
    const dailySigma = s.volatility / Math.sqrt(252);
    expect(s.var95).toBeCloseTo(1.645 * dailySigma - dailyMu, 12);
  });

  it('diversifies: the minimum-variance portfolio is less volatile than any single asset', () => {
    const points = frontier(mu, cov, 0.02);
    const minVol = Math.min(...points.efficient.map((p) => p.volatility));
    expect(minVol).toBeLessThan(Math.min(...ASSETS.map((a) => a.volatility)));
  });

  it('the efficient frontier rises: more volatility buys more return', () => {
    const { efficient } = frontier(mu, cov, 0.02);
    for (let i = 1; i < efficient.length; i++) {
      expect(efficient[i].volatility).toBeGreaterThanOrEqual(efficient[i - 1].volatility);
      expect(efficient[i].expectedReturn).toBeGreaterThan(efficient[i - 1].expectedReturn);
    }
  });

  it('rebalance keeps the edited weight and shares the rest in proportion', () => {
    const next = rebalance([0.2, 0.3, 0.5], 0, 0.6);
    expect(next[0]).toBeCloseTo(0.6, 10);
    expect(next[1] / next[2]).toBeCloseTo(0.3 / 0.5, 10);
    expect(next.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});
