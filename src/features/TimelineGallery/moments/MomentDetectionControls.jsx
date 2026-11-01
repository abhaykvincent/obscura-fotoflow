import { memo } from 'react';
import {
  DEFAULT_MOMENT_CONFIG,
  MOMENT_CONFIG_LIMITS,
  MOMENT_STRATEGIES,
  MOMENT_STRATEGY_LABELS,
  normalizeMomentConfig,
} from './momentConfig';

const percent = (value) => `${Math.round(value * 100)}%`;

const MomentDetectionControls = memo(({
  config,
  appliedConfig,
  isDetecting,
  stats,
  onChange,
  onRegenerate,
  onReset,
}) => {
  const update = (patch) => onChange?.({ ...config, ...patch });
  const active = normalizeMomentConfig(appliedConfig);
  const limits = MOMENT_CONFIG_LIMITS;

  const missingEmbeddings = stats
    ? stats.photosWithoutEmbeddings
    : null;

  return (
    <section className="timeline-controls moment-controls" aria-label="Moment detection developer controls">
      <div className="timeline-controls-top">
        <div>
          <span className="timeline-eyebrow">Experimental · read-only</span>
          <h3>Moment detection</h3>
        </div>

        <div className="timeline-active-config">
          <span className={`timeline-active-dot ${isDetecting ? 'is-busy' : ''}`} />
          <span>
            {active.enabled
              ? `Active: visual ${percent(active.visualSensitivity)} · temporal ${percent(active.temporalSensitivity)} · min ${active.minMomentSize} · max gap ${active.maxGapMinutes} min`
              : 'Active: off'}
          </span>
        </div>
      </div>

      <div className="timeline-control-row">
        <label className="moment-toggle">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(event) => update({ enabled: event.target.checked })}
          />
          <span>
            Enable Moment Detection
            <small>Nested inside existing temporal segments</small>
          </span>
        </label>

        <label className="timeline-field">
          <span className="timeline-field-label">Strategy</span>
          <select
            value={config.strategy}
            disabled={!config.enabled}
            onChange={(event) => update({ strategy: event.target.value })}
          >
            {Object.values(MOMENT_STRATEGIES).map((strategy) => (
              <option key={strategy} value={strategy}>
                {MOMENT_STRATEGY_LABELS[strategy]}
              </option>
            ))}
          </select>
        </label>

        <label className="timeline-field moment-slider">
          <span className="timeline-field-label">
            Visual similarity sensitivity
            <strong>{percent(config.visualSensitivity)}</strong>
          </span>
          <input
            type="range"
            min={limits.visualSensitivity.min}
            max={limits.visualSensitivity.max}
            step={limits.visualSensitivity.step}
            value={config.visualSensitivity}
            disabled={!config.enabled}
            onChange={(event) => update({ visualSensitivity: Number(event.target.value) })}
          />
          <small className="moment-field-hint">Lower splits more; higher merges more.</small>
        </label>

        <label className="timeline-field moment-slider">
          <span className="timeline-field-label">
            Temporal continuity sensitivity
            <strong>{percent(config.temporalSensitivity)}</strong>
          </span>
          <input
            type="range"
            min={limits.temporalSensitivity.min}
            max={limits.temporalSensitivity.max}
            step={limits.temporalSensitivity.step}
            value={config.temporalSensitivity}
            disabled={!config.enabled}
            onChange={(event) => update({ temporalSensitivity: Number(event.target.value) })}
          />
          <small className="moment-field-hint">Lower respects short pauses; higher tolerates them.</small>
        </label>

        <label className="timeline-field">
          <span className="timeline-field-label">Minimum photos / Moment</span>
          <input
            type="number"
            min={limits.minMomentSize.min}
            max={limits.minMomentSize.max}
            step={limits.minMomentSize.step}
            value={config.minMomentSize}
            disabled={!config.enabled}
            onChange={(event) => update({ minMomentSize: Number(event.target.value) })}
          />
        </label>

        <label className="timeline-field">
          <span className="timeline-field-label">Maximum temporal gap (minutes)</span>
          <input
            type="number"
            min={limits.maxGapMinutes.min}
            max={limits.maxGapMinutes.max}
            step={limits.maxGapMinutes.step}
            value={config.maxGapMinutes}
            disabled={!config.enabled}
            onChange={(event) => update({ maxGapMinutes: Number(event.target.value) })}
          />
        </label>

        <div className="timeline-control-actions">
          <button
            type="button"
            className="timeline-button primary"
            onClick={onRegenerate}
            disabled={!config.enabled || isDetecting}
          >
            {isDetecting ? 'Detecting…' : 'Regenerate Moments'}
          </button>
          <button
            type="button"
            className="timeline-button"
            onClick={() => {
              onChange?.({ ...DEFAULT_MOMENT_CONFIG });
              onReset?.();
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {missingEmbeddings !== null && missingEmbeddings > 0 && (
        <p className="moment-embedding-warning" role="status">
          {missingEmbeddings.toLocaleString()} photo{missingEmbeddings === 1 ? '' : 's'} in temporal segments
          have no usable Gemini Embedding 2 vector. They are listed as unassigned and are never treated as
          zero vectors. No embeddings are generated by this feature.
        </p>
      )}

      <p className="timeline-control-note">
        Moments are detected independently inside each temporal segment. Distances use cosine distance;
        similar embeddings in temporally distant photos are not merged. Camera IDs are shown for context
        only and never decide membership.
      </p>
    </section>
  );
});

MomentDetectionControls.displayName = 'MomentDetectionControls';

export default MomentDetectionControls;
