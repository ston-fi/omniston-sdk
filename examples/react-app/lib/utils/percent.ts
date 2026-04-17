/**
 * Utilities for converting between percentage representations.
 *
 * Terms:
 * - **percent** — human-readable value in the range [0, 100]. E.g. 5 means 5%.
 * - **ratio**   — fractional value in the range [0, 1]. E.g. 0.05 means 5%.
 * - **pips**    — integer representation used by the API, where 1 pip = 0.0001%.
 *                 1% = 10_000 pips, 100% = 1_000_000 pips.
 */

export function percentToPips(percent: number): number {
  const scalingFactor = 100 * 100;

  const min = 0;
  const max = 100;

  if (percent < min || percent > max) {
    throw new Error(`Invalid value. Must be between ${min} and ${max}.`);
  }

  return percent * scalingFactor;
}

export function pipsToPercent(pips: number): number {
  const scalingFactor = 100 * 100;

  const min = 0;
  const max = scalingFactor * 100;

  if (pips < min || pips > max) {
    throw new Error(`Invalid value. Must be between ${min} and ${max}.`);
  }

  return pips / scalingFactor;
}

export function ratioToPips(ratio: number): number {
  const scalingFactor = 100 * 100 * 100;

  const min = 0;
  const max = 1;

  if (ratio < min || ratio > max) {
    throw new Error(`Invalid value. Must be between ${min} and ${max}.`);
  }

  return ratio * scalingFactor;
}

export function pipsToRatio(pips: number): number {
  const scalingFactor = 100 * 100 * 100;

  const min = 0;
  const max = scalingFactor;

  if (pips < min || pips > max) {
    throw new Error(`Invalid value. Must be between ${min} and ${max}.`);
  }

  return pips / scalingFactor;
}
