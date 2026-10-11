import React, { useMemo } from 'react';
import { getSelectionProgress } from '../../../utils/selectionGalleryUtils';

/**
 * Overall selection progress header.
 * Shows "72 / 80 selected", percent bar, and remaining messaging.
 */
export default function SelectionProgress({ gallery, count: countOverride = null }) {
  const progress = useMemo(() => {
    const base = getSelectionProgress(gallery || {});
    if (countOverride !== null && countOverride !== undefined) {
      const limit = base.limit;
      const count = Number(countOverride);
      if (limit === null || limit <= 0) return { ...base, count };
      return {
        ...base,
        count,
        percent: Math.min(100, Math.round((count / limit) * 100)),
        remaining: Math.max(0, limit - count),
        isComplete: count >= limit,
        isEmpty: count === 0,
      };
    }
    return base;
  }, [gallery, countOverride]);

  if (progress.limit === null) {
    return (
      <div className="selection-progress" data-testid="selection-progress">
        <div className="selection-progress-text">
          <strong>{progress.count}</strong> photos selected
        </div>
        <div className="selection-progress-sub">No limit — select as many as you love.</div>
      </div>
    );
  }

  const nearLimit = progress.remaining <= 5 && !progress.isComplete;
  return (
    <div className="selection-progress" data-testid="selection-progress">
      <div className="selection-progress-text">
        <strong>{progress.count} / {progress.limit}</strong> photos selected
        <span className="selection-progress-percent"> · {progress.percent}% complete</span>
      </div>
      <div className="selection-progress-bar" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="selection-progress-fill" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="selection-progress-sub">
        {progress.isComplete ? (
          <span className="limit-reached">Selection limit reached — review and finish your selection.</span>
        ) : nearLimit ? (
          <span>{progress.remaining} selections remaining</span>
        ) : (
          <span>{progress.remaining} remaining of {progress.limit} required</span>
        )}
      </div>
    </div>
  );
}
