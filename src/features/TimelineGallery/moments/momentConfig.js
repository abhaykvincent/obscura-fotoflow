/**
 * Moment Detection configuration.
 *
 * Pure module: no React, no gallery imports. Configuration values are clamped
 * so a partially typed input can never produce NaN / Infinity inside the
 * clustering engine.
 */

export const MOMENT_STRATEGIES = {
  TEMPORAL_AGGLOMERATIVE: 'temporal-agglomerative',
};

export const MOMENT_STRATEGY_LABELS = {
  [MOMENT_STRATEGIES.TEMPORAL_AGGLOMERATIVE]: 'Temporal-constrained agglomerative',
};

export const DEFAULT_MOMENT_CONFIG = {
  enabled: true,
  strategy: MOMENT_STRATEGIES.TEMPORAL_AGGLOMERATIVE,
  // 0 = conservative (few, very tight moments), 1 = permissive (more merges).
  visualSensitivity: 0.5,
  // 0 = short shooting bursts matter most, 1 = tolerate long pauses.
  temporalSensitivity: 0.5,
  minMomentSize: 1,
  maxGapMinutes: 30,
  representativeCount: 4,
};

export const MOMENT_CONFIG_LIMITS = {
  visualSensitivity: { min: 0, max: 1, step: 0.05 },
  temporalSensitivity: { min: 0, max: 1, step: 0.05 },
  minMomentSize: { min: 1, max: 100, step: 1 },
  maxGapMinutes: { min: 0, max: 1440, step: 1 },
  representativeCount: { min: 1, max: 8, step: 1 },
};

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const clampInteger = (value, { min, max }, fallback) => {
  const number = clamp(value, min, max, fallback);
  return Math.round(number);
};

export const normalizeMomentConfig = (config = {}) => {
  const strategy = Object.values(MOMENT_STRATEGIES).includes(config.strategy)
    ? config.strategy
    : DEFAULT_MOMENT_CONFIG.strategy;

  return {
    enabled: config.enabled !== undefined
      ? Boolean(config.enabled)
      : DEFAULT_MOMENT_CONFIG.enabled,
    strategy,
    visualSensitivity: clamp(
      config.visualSensitivity,
      MOMENT_CONFIG_LIMITS.visualSensitivity.min,
      MOMENT_CONFIG_LIMITS.visualSensitivity.max,
      DEFAULT_MOMENT_CONFIG.visualSensitivity,
    ),
    temporalSensitivity: clamp(
      config.temporalSensitivity,
      MOMENT_CONFIG_LIMITS.temporalSensitivity.min,
      MOMENT_CONFIG_LIMITS.temporalSensitivity.max,
      DEFAULT_MOMENT_CONFIG.temporalSensitivity,
    ),
    minMomentSize: clampInteger(
      config.minMomentSize,
      MOMENT_CONFIG_LIMITS.minMomentSize,
      DEFAULT_MOMENT_CONFIG.minMomentSize,
    ),
    maxGapMinutes: clamp(
      config.maxGapMinutes,
      MOMENT_CONFIG_LIMITS.maxGapMinutes.min,
      MOMENT_CONFIG_LIMITS.maxGapMinutes.max,
      DEFAULT_MOMENT_CONFIG.maxGapMinutes,
    ),
    representativeCount: clampInteger(
      config.representativeCount,
      MOMENT_CONFIG_LIMITS.representativeCount,
      DEFAULT_MOMENT_CONFIG.representativeCount,
    ),
  };
};

/**
 * Stable key used by the per-segment result cache and by the UI's
 * "active configuration" display.
 */
export const momentConfigKey = (config) => {
  const c = normalizeMomentConfig(config);
  return [
    c.strategy,
    c.visualSensitivity,
    c.temporalSensitivity,
    c.minMomentSize,
    c.maxGapMinutes,
    c.representativeCount,
  ].join('|');
};
