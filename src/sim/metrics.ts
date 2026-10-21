export interface RoundPercentiles {
  avg: number;
  min: number;
  max: number;
  p5: number;
  p25: number;
  p50: number; // median
  p75: number;
  p95: number;
}

/**
 * Computes quantiles from an array of rounds using standard nearest-rank method.
 */
export function calculateRoundPercentiles(rounds: number[]): RoundPercentiles {
  if (rounds.length === 0) {
    return { avg: 0, min: 0, max: 0, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 };
  }

  const sorted = [...rounds].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  const getP = (p: number): number => {
    const idx = Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1));
    return sorted[idx];
  };

  return {
    avg: Number((sum / n).toFixed(2)),
    min: sorted[0],
    max: sorted[n - 1],
    p5: getP(0.05),
    p25: getP(0.25),
    p50: getP(0.50),
    p75: getP(0.75),
    p95: getP(0.95),
  };
}
