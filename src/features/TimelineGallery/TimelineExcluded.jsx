import { memo, useState } from 'react';
import TimelinePhoto from './TimelinePhoto';

const INITIAL_VISIBLE = 12;
const PAGE_SIZE = 48;

/**
 * Invalid / missing timestamps are surfaced explicitly instead of being
 * silently dropped by the segmentation engine.
 */
const TimelineExcluded = memo(({ photos = [], onOpenPhoto }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  if (photos.length === 0) return null;

  return (
    <section className="timeline-excluded" aria-label="Photos excluded from temporal segmentation">
      <div className="timeline-excluded-header">
        <span className="timeline-excluded-badge">!</span>
        <div>
          <h3>Excluded from segmentation — {photos.length} photo{photos.length === 1 ? '' : 's'}</h3>
          <p>Missing, empty, or invalid capture timestamp. These photos are kept visible and were not discarded.</p>
        </div>
      </div>

      <div className="timeline-photo-grid">
        {photos.slice(0, visibleCount).map((photo, index) => (
          <TimelinePhoto
            key={`excluded-${photo.photoId || photo.id || photo.url || index}`}
            photo={photo}
            index={index}
            onClick={onOpenPhoto}
          />
        ))}
      </div>

      {photos.length > visibleCount && (
        <button
          type="button"
          className="timeline-button timeline-excluded-more"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Show more excluded photos ({photos.length - visibleCount} remaining)
        </button>
      )}
    </section>
  );
});

TimelineExcluded.displayName = 'TimelineExcluded';

export default TimelineExcluded;
