/**
 * Temporal continuity utilities (React-free).
 *
 * The engine never uses a single global time threshold. Each parent temporal
 * segment gets an adaptive scale derived from its own capture rhythm:
 *   - burst-heavy shoots produce a small scale (sub-second gaps matter)
 *   - posed/ritual shoots produce a larger scale (minutes between frames)
 *
 * The developer's temporal sensitivity stretches or tightens that scale, while
 * the explicit maximum-gap control stays a hard boundary.
 */

const MIN_SCALE_MS = 15 * 1000;
const MAX_SCALE_MS = 2 * 60 * 60 * 1000;

const percentile = (sortedValues, p) => {
  if (sortedValues.length === 0) return 0;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

/**
 * @param {Array<{ timestamp: number }>} entries - chronologically sorted
 * @returns {{ medianGapMs: number, p90GapMs: number, positiveGapCount: number }}
 */
export const computeTemporalProfile = (entries = []) => {
  const gaps = [];
  for (let i = 1; i < entries.length; i += 1) {
    const gap = entries[i].timestamp - entries[i - 1].timestamp;
    if (Number.isFinite(gap) && gap > 0) gaps.push(gap);
  }
  gaps.sort((a, b) => a - b);

  return {
    medianGapMs: percentile(gaps, 0.5),
    p90GapMs: percentile(gaps, 0.9),
    positiveGapCount: gaps.length,
  };
};

/**
 * Adaptive time constant (a "soft" time threshold) for one segment.
 *
 * temporalSensitivity 0 → 1.2×median gap (tight)
 * temporalSensitivity 1 → 6×median gap (permissive)
 */
export const computeAdaptiveTemporalScale = (entries = [], temporalSensitivity = 0.5) => {
  const { medianGapMs } = computeTemporalProfile(entries);
  const sensitivity = Math.min(1, Math.max(0, Number(temporalSensitivity) || 0));
  const multiplier = 1.2 + 4.8 * sensitivity;

  if (!Number.isFinite(medianGapMs) || medianGapMs <= 0) {
    // Duplicate timestamps / a single photo: fall back to a modest scale so a
    // burst still reads as continuous without letting hour-long gaps through.
    return MIN_SCALE_MS * multiplier;
  }

  return Math.min(MAX_SCALE_MS, Math.max(MIN_SCALE_MS, medianGapMs * multiplier));
};

/**
 * 0 = perfectly continuous, 1 = temporally unrelated.
 */
export const temporalBreak = (gapMs, scaleMs) => {
  if (!Number.isFinite(gapMs) || gapMs <= 0) return 0;
  if (!Number.isFinite(scaleMs) || scaleMs <= 0) return 1;
  return 1 - Math.exp(-gapMs / scaleMs);
};

export const temporalContinuity = (gapMs, scaleMs) => 1 - temporalBreak(gapMs, scaleMs);
