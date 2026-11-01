import { memo, useEffect, useState } from 'react';
import TimelinePhoto from './TimelinePhoto';
import {
  formatDateTime,
  formatDuration,
  formatGap,
} from './segmentation/timestampUtils';

const INITIAL_VISIBLE_PHOTOS = 12;
const PHOTO_PAGE_SIZE = 48;

/**
 * A single temporal segment. The header is clickable so developers can focus /
 * inspect a segment without losing the chronological timeline around it.
 */
const TimelineSegment = memo(({ segment, isSelected, onSelect, onOpenPhoto }) => {
  const [visibleCount, setVisibleCount] = useState(
    isSelected ? PHOTO_PAGE_SIZE : INITIAL_VISIBLE_PHOTOS,
  );

  useEffect(() => {
    setVisibleCount(isSelected ? PHOTO_PAGE_SIZE : INITIAL_VISIBLE_PHOTOS);
  }, [isSelected, segment.id]);

  return (
    <section
      id={segment.id}
      className={`timeline-segment ${isSelected ? 'is-selected' : ''}`}
      data-segment-index={segment.index}
    >
      <button
        type="button"
        className="timeline-segment-header"
        onClick={() => onSelect?.(segment.id)}
        aria-pressed={isSelected}
        aria-label={`Inspect segment ${segment.index}`}
      >
        <span className="timeline-segment-number">S{String(segment.index).padStart(2, '0')}</span>

        <span className="timeline-segment-heading">
          <strong>Segment {segment.index}</strong>
          <span>{segment.photoCount} photo{segment.photoCount === 1 ? '' : 's'}</span>
        </span>

        <span className="timeline-segment-metrics">
          <span>
            <small>Start</small>
            {formatDateTime(segment.startTime)}
          </span>
          <span>
            <small>End</small>
            {formatDateTime(segment.endTime)}
          </span>
          <span>
            <small>Duration</small>
            {formatDuration(segment.durationMs)}
          </span>
          <span>
            <small>Gap from previous</small>
            {segment.gapFromPreviousMs === null ? '—' : formatGap(segment.gapFromPreviousMs)}
          </span>
        </span>

        <span className="timeline-segment-chevron" aria-hidden="true">
          {isSelected ? '−' : '+'}
        </span>
      </button>

      <div className="timeline-photo-grid">
        {segment.photos.slice(0, visibleCount).map((photo, index) => (
          <TimelinePhoto
            key={`${segment.id}-${photo.photoId || photo.id || photo.url || index}`}
            photo={photo}
            index={index}
            onClick={onOpenPhoto}
          />
        ))}
      </div>

      {segment.photoCount > visibleCount && (
        <div className="timeline-segment-more">
          <span>Showing {visibleCount} of {segment.photoCount}.</span>
          <button
            type="button"
            className="timeline-button"
            onClick={() => setVisibleCount((count) => count + PHOTO_PAGE_SIZE)}
          >
            Show next {Math.min(PHOTO_PAGE_SIZE, segment.photoCount - visibleCount)} photos
          </button>
        </div>
      )}
    </section>
  );
});

TimelineSegment.displayName = 'TimelineSegment';

export default TimelineSegment;
