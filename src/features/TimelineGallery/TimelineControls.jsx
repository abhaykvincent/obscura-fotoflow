import { memo } from 'react';
import {
  DEFAULT_SEGMENTATION_CONFIG,
  SEGMENTATION_ALGORITHMS,
} from './segmentation/temporalSegmentation';

const AlgorithmButton = ({ active, children, onClick }) => (
  <button
    type="button"
    className={`timeline-algorithm ${active ? 'is-active' : ''}`}
    onClick={onClick}
    aria-pressed={active}
  >
    {children}
  </button>
);

const TimelineControls = memo(({
  config,
  appliedConfig,
  isComputing,
  onChange,
  onRerun,
  onReset,
}) => {
  const isPelt = config.algorithm === SEGMENTATION_ALGORITHMS.PELT;
  const appliedIsPelt = appliedConfig.algorithm === SEGMENTATION_ALGORITHMS.PELT;

  const update = (patch) => onChange?.({ ...config, ...patch });

  return (
    <section className="timeline-controls" aria-label="Temporal segmentation developer controls">
      <div className="timeline-controls-top">
        <div>
          <span className="timeline-eyebrow">Developer controls</span>
          <h3>Temporal segmentation</h3>
        </div>

        <div className="timeline-active-config">
          <span className={`timeline-active-dot ${isComputing ? 'is-busy' : ''}`} />
          <span>
            Active: {appliedIsPelt ? 'PELT' : 'Time gap'}
            {appliedIsPelt
              ? ` · penalty ${appliedConfig.peltPenalty}`
              : ` · ${appliedConfig.timeGapMinutes} min`}
          </span>
        </div>
      </div>

      <div className="timeline-control-row">
        <div className="timeline-field timeline-field-algorithm">
          <span className="timeline-field-label">Algorithm</span>
          <div className="timeline-algorithm-switch" role="group" aria-label="Segmentation algorithm">
            <AlgorithmButton
              active={!isPelt}
              onClick={() => update({ algorithm: SEGMENTATION_ALGORITHMS.TIME_GAP })}
            >
              Time Gap <small>baseline</small>
            </AlgorithmButton>
            <AlgorithmButton
              active={isPelt}
              onClick={() => update({ algorithm: SEGMENTATION_ALGORITHMS.PELT })}
            >
              PELT <small>experimental</small>
            </AlgorithmButton>
          </div>
        </div>

        {!isPelt && (
          <label className="timeline-field">
            <span className="timeline-field-label">Gap threshold (minutes)</span>
            <input
              type="number"
              min="1"
              max="1440"
              step="1"
              value={config.timeGapMinutes}
              onChange={(event) => update({ timeGapMinutes: Number(event.target.value) })}
            />
          </label>
        )}

        {isPelt && (
          <label className="timeline-field">
            <span className="timeline-field-label">PELT penalty (MSE units)</span>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={config.peltPenalty}
              onChange={(event) => update({ peltPenalty: Number(event.target.value) })}
            />
          </label>
        )}

        <div className="timeline-control-actions">
          <button type="button" className="timeline-button primary" onClick={onRerun}>
            Re-run segmentation
          </button>
          <button
            type="button"
            className="timeline-button"
            onClick={() => {
              onChange?.({ ...DEFAULT_SEGMENTATION_CONFIG });
              onReset?.();
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <p className="timeline-control-note">
        {isPelt
          ? 'PELT costs mean squared deviation of log inter-photo gaps. Lower penalty = more change points.'
          : 'A new segment starts whenever consecutive capture times exceed the gap threshold. Changes apply automatically.'}
      </p>
    </section>
  );
});

TimelineControls.displayName = 'TimelineControls';

export default TimelineControls;
