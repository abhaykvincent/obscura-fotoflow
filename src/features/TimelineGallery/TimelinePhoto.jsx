import { memo } from 'react';
import { getThumbnailUrl } from '../../utils/urlUtils';
import {
  formatTime,
  photoIdentity,
  resolveCaptureTimestamp,
} from './segmentation/timestampUtils';

/**
 * Timeline-specific photo tile.
 *
 * Reuses the existing thumbnail delivery gateway and native lazy loading. It
 * deliberately has no write actions: Timeline (New) is a read-only inspection
 * surface, so existing selection/favorite workflows are left untouched.
 */
const TimelinePhoto = memo(({ photo, index, onClick }) => {
  const source = photo?.url || photo?.thumbUrl || '';
  const thumbnail = getThumbnailUrl(source);
  const captureTimestamp = resolveCaptureTimestamp(photo)?.timestamp ?? null;
  const title = `${photo?.name || 'Photo'}${Number.isFinite(captureTimestamp) ? ` — ${new Date(captureTimestamp).toLocaleString()}` : ' — no capture timestamp'}`;

  return (
    <button
      type="button"
      className="timeline-photo"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(photo);
      }}
      title={title}
      aria-label={title}
      data-photo-id={photoIdentity(photo)}
    >
      <img
        src={thumbnail}
        alt={photo?.name || `Timeline photo ${index + 1}`}
        loading="lazy"
        decoding="async"
      />
      <span className="timeline-photo-time">
        {Number.isFinite(captureTimestamp) ? formatTime(captureTimestamp) : 'No time'}
      </span>
    </button>
  );
});

TimelinePhoto.displayName = 'TimelinePhoto';

export default TimelinePhoto;
