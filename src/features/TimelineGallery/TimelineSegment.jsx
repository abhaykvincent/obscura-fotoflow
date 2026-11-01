import { memo, useEffect, useState } from 'react';
import TimelinePhoto from './TimelinePhoto';
import MomentTimelineGroup from './moments/MomentTimelineGroup';
import {
  formatDateTime,
  formatDuration,
  formatGap,
} from './segmentation/timestampUtils';

const INITIAL_VISIBLE_PHOTOS = 12;
const PHOTO_PAGE_SIZE = 48;
const INITIAL_VISIBLE_UNASSIGNED = 12;

const UnassignedPhotos = ({ photos, segmentId, onOpenPhoto }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_UNASSIGNED);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_UNASSIGNED);
  }, [segmentId]);

  if (photos.length === 0) return null;

  return (
    <div className="moment-unassigned">
      <div className="moment-unassigned-header">
        <span className="moment-unassigned-badge">?</span>
        <div>
          <strong>Unassigned photographs</strong>
          <p>
            {photos.length} photo{photos.length === 1 ? '' : 's'} could not participate in visual
            clustering. Reasons are listed per photo; records were not modified.
          </p>
        </div>
      </div>

      <div className="timeline-photo-grid">
        {photos.slice(0, visibleCount).map((entry, index) => (
          <div className="moment-unassigned-tile" key={`${segmentId}-unassigned-${entry.photoId || index}`}>
            <TimelinePhoto photo={entry.photo} index={index} onClick={onOpenPhoto} />
            <span className="moment-unassigned-reason" title={entry.message}>
              {entry.reason}
            </span>
          </div>
        ))}
      </div>

      {photos.length > visibleCount && (
        <div className="moment-more">
          <span>Showing {visibleCount} of {photos.length}.</span>
          <button
            type="button"
            className="timeline-button"
            onClick={() => setVisibleCount((count) => count + PHOTO_PAGE_SIZE)}
          >
            Show next {Math.min(PHOTO_PAGE_SIZE, photos.length - visibleCount)} photos
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * A single temporal segment. The header is clickable so developers can focus /
 * inspect a segment without losing the chronological timeline around it.
 *
 * When Moment Detection is enabled, moments are rendered as nested groups and
 * the raw photo grid is replaced (photos remain reachable through a Moment or
 * the unassigned list). Parent segment boundaries stay visually stronger than
 * Moment boundaries.
 */
const TimelineSegment = memo(({
  segment,
  isSelected,
  onSelect,
  onOpenPhoto,
  momentDetectionEnabled = false,
  momentResult = null,
}) => {
  const [visibleCount, setVisibleCount] = useState(
    isSelected ? PHOTO_PAGE_SIZE : INITIAL_VISIBLE_PHOTOS,
  );

  useEffect(() => {
    setVisibleCount(isSelected ? PHOTO_PAGE_SIZE : INITIAL_VISIBLE_PHOTOS);
  }, [isSelected, segment.id]);

  const moments = momentResult?.moments || [];
  const unassigned = momentResult?.unassignedPhotos || [];

  return (
    <section
      id={segment.id}
      className={`timeline-segment ${isSelected ? 'is-selected' : ''} ${momentDetectionEnabled ? 'has-moments' : ''}`}
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
          <span>
            {segment.photoCount} photo{segment.photoCount === 1 ? '' : 's'}
            {momentDetectionEnabled && momentResult
              ? ` · ${moments.length} moment${moments.length === 1 ? '' : 's'} · ${momentResult.photosWithEmbeddings}/${segment.photoCount} embedded`
              : ''}
          </span>
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

      {momentDetectionEnabled ? (
        <div className="moment-list">
          {!momentResult && (
            <div className="moment-pending">Detecting Moments inside this segment…</div>
          )}

          {momentResult && moments.length === 0 && unassigned.length === 0 && (
            <div className="moment-pending">No photos in this segment.</div>
          )}

          {momentResult && moments.length === 0 && unassigned.length > 0 && (
            <div className="moment-pending">
              No Moment met the current configuration. All {unassigned.length} photos are listed below.
            </div>
          )}

          {moments.map((moment) => (
            <MomentTimelineGroup
              key={moment.id}
              moment={moment}
              onOpenPhoto={onOpenPhoto}
            />
          ))}

          <UnassignedPhotos
            photos={unassigned}
            segmentId={segment.id}
            onOpenPhoto={onOpenPhoto}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
});

TimelineSegment.displayName = 'TimelineSegment';

export default TimelineSegment;
