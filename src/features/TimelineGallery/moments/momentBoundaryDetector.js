/**
 * Moment boundary decision (React-free).
 *
 * Converts the two developer sensitivities into a single, inspectable merge
 * decision. The decision blends a visual-distance limit with temporal break and
 * exposes the components so the engine/report can explain why two clusters were
 * kept apart.
 */

import { temporalBreak } from './temporalContinuityCalculator';

const COMBINED_ACCEPTANCE = 0.72;

export const createMomentBoundaryDetector = ({ config, temporalScaleMs }) => {
  const visualSensitivity = Math.min(1, Math.max(0, config.visualSensitivity));
  const temporalSensitivity = Math.min(1, Math.max(0, config.temporalSensitivity));
  const maxGapMs = Math.max(0, config.maxGapMinutes) * 60 * 1000;

  // 0.25 (strict) .. 0.95 (permissive) cosine distance.
  const baseVisualLimit = 0.95 - 0.7 * visualSensitivity;

  // Temporal sensitivity controls how strongly a pause pushes the pair apart.
  const temporalWeight = 0.12 + 0.4 * temporalSensitivity;

  const evaluate = ({ visualDistance, gapMs }) => {
    if (visualDistance === null || !Number.isFinite(visualDistance)) {
      return {
        accepted: false,
        reason: 'missing-visual-distance',
        visualDistance: null,
        temporalBreak: null,
        score: Infinity,
      };
    }

    const breakScore = temporalBreak(gapMs, temporalScaleMs);

    // Continuous bursts get a small visual allowance: a bride turning her head
    // changes the frame a lot without starting a new moment.
    const continuityBonus = 0.1 * (1 - breakScore);
    const visualLimit = Math.min(1, baseVisualLimit + continuityBonus);

    const score = (1 - temporalWeight) * visualDistance + temporalWeight * breakScore;

    const withinGap = gapMs <= maxGapMs;
    const withinVisual = visualDistance <= visualLimit;
    const withinCombined = score <= COMBINED_ACCEPTANCE;

    let reason = 'accepted';
    if (!withinGap) reason = 'temporal-gap-exceeded';
    else if (!withinVisual) reason = 'visual-distance-exceeded';
    else if (!withinCombined) reason = 'combined-score-exceeded';

    return {
      accepted: withinGap && withinVisual && withinCombined,
      reason,
      visualDistance,
      visualLimit,
      temporalBreak: breakScore,
      temporalWeight,
      score,
    };
  };

  return {
    evaluate,
    visualLimit: baseVisualLimit,
    temporalWeight,
    maxGapMs,
    temporalScaleMs,
  };
};
