import { memo, useEffect, useState } from 'react';
import TimelinePhoto from '../TimelinePhoto';
import { formatDateTime, formatDuration, formatTime } from '../segmentation/timestampUtils';

const INITIAL_VISIBLE_PHOTOS = 24;
const PHOTO_PAGE_SIZE = 48;

const MomentTimelineGroup = memo(({ moment, onOpenPhoto }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PHOTOS);

  useEffect(() => {
    setIsExpanded(false);
    setVisibleCount(INITIAL_VISIBLE_PHOTOS);
  }, [moment.id]);

  const cohesion = moment.avgSimilarityToCentroid;
  const visiblePhotos = moment.photos.slice(0, visibleCount);

  return (
    <article className="moment-group" data-moment-id={moment.id}>
      <button
        type="button"
        className="moment-header"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
        aria-label={`Inspect ${moment.label} in segment ${moment.parentSegmentIndex}`}
      >
        <span className="moment-badge">{moment.label}</span>

        <span className="moment-heading">
          <strong>{moment.label}</strong>
          <span>{moment.photoCount} photo{moment.photoCount === 1 ? '' : 's'}</span>
        </span>

        <span className="moment-metrics">
          <span>
            <small>Start</small>
            {formatTime(moment.startTime)}
          </span>
          <span>
            <small>End</small>
            {formatTime(moment.endTime)}
          </span>
          <span>
            <small>Duration</small>
            {formatDuration(moment.durationMs)}
          </span>
          <span>
            <small>Visual cohesion</small>
            {cohesion === null ? '—' : cohesion.toFixed(2)}
          </span>
          {moment.cameraIds.length > 1 && (
            <span>
              <small>Cameras</small>
              {moment.cameraIds.length}
            </span>
          )}
        </span>

        <span className="moment-chevron" aria-hidden="true">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      <div className="moment-meta-line">
        <span>
          Parent S{String(moment.parentSegmentIndex).padStart(2, '0')} · {formatDateTime(moment.startTime)}
          {moment.startTime !== moment.endTime ? ` → ${formatDateTime(moment.endTime)}` : ''}
        </span>
        {cohesion !== null && (
          <span className="moment-cohesion-note">
            cohesion = mean cosine similarity to centroid (not a probability)
          </span>
        )}
      </div>

      {moment.representativePhotos.length > 0 && (
        <div className="moment-representatives" aria-label={`${moment.label} representative photos`}>
          <span className="moment-representatives-label">Representative</span>
          <div className="moment-representatives-row">
            {moment.representativePhotos.map((photo, index) => (
              <div
                className="moment-representative-tile"
                key={`${moment.id}-rep-${photo.photoId || photo.id || index}`}
              >
                <TimelinePhoto photo={photo} index={index} onClick={onOpenPhoto} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          <div className="moment-photo-grid">
            {visiblePhotos.map((photo, index) => (
              <TimelinePhoto
                key={`${moment.id}-${photo.photoId || photo.id || photo.url || index}`}
                photo={photo}
                index={index}
                onClick={onOpenPhoto}
              />
            ))}
          </div>

          {moment.photoCount > visibleCount && (
            <div className="moment-more">
              <span>Showing {visibleCount} of {moment.photoCount}.</span>
              <button
                type="button"
                className="timeline-button"
                onClick={() => setVisibleCount((count) => count + PHOTO_PAGE_SIZE)}
              >
                Show next {Math.min(PHOTO_PAGE_SIZE, moment.photoCount - visibleCount)} photos
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
});

MomentTimelineGroup.displayName = 'MomentTimelineGroup';

export default MomentTimelineGroup;
