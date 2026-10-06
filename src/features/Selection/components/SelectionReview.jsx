import React, { useMemo } from 'react';
import { getSelectionSummary, canCompleteGallery } from '../../../utils/selectionGalleryUtils';

/**
 * Pre-completion review summary.
 * Blocks Finish when required-category minimums are unmet.
 */
export default function SelectionReview({ gallery, onBack, onFinish, finishing = false }) {
  const summary = useMemo(() => getSelectionSummary(gallery || {}), [gallery]);
  const gate = useMemo(() => canCompleteGallery(gallery || {}), [gallery]);

  return (
    <div className="selection-review" data-testid="selection-review">
      <h3>Your Selection</h3>
      <p className="selection-review-total">
        {summary.overall.limit !== null
          ? `${summary.overall.count} of ${summary.overall.limit} photos selected`
          : `${summary.overall.count} photos selected`}
      </p>
      <div className="selection-review-categories">
        {summary.categories.map((c) => (
          <div key={c.id} className="selection-review-row">
            <span>{c.name}</span>
            <span>{c.progress.limit !== null ? `${c.progress.count} / ${c.progress.limit}` : `${c.progress.count}`}</span>
          </div>
        ))}
      </div>
      {!gate.canComplete && (
        <div className="selection-review-blockers" role="alert">
          <p>You still need:</p>
          <ul>
            {gate.blockers.map((b, i) => (
              <li key={i}>
                {b.type === 'category-minimum'
                  ? `${b.categoryName} — ${b.needed} more photo${b.needed === 1 ? '' : 's'}`
                  : b.type === 'already-completed'
                    ? 'This gallery is already completed.'
                    : 'This gallery is not active.'}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="selection-review-actions">
        <button className="button secondary" onClick={onBack}>Back</button>
        <button
          className="button primary large"
          disabled={!gate.canComplete || finishing}
          onClick={onFinish}
        >
          {finishing ? 'Finishing…' : 'Finish Selection'}
        </button>
      </div>
    </div>
  );
}
