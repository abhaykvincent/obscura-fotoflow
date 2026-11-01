import { memo } from 'react';
import { formatDuration, formatGap } from './segmentation/timestampUtils';

const Stat = ({ label, value, hint }) => (
  <div className="timeline-stat">
    <span className="timeline-stat-label">{label}</span>
    <strong className="timeline-stat-value">{value}</strong>
    {hint && <span className="timeline-stat-hint">{hint}</span>}
  </div>
);

const TimelineSummary = memo(({ stats }) => {
  if (!stats) return null;

  return (
    <div className="timeline-summary" aria-label="Temporal segmentation summary">
      <Stat label="Photos considered" value={stats.totalPhotos} />
      <Stat label="Valid timestamps" value={stats.validPhotos} />
      <Stat
        label="Excluded"
        value={stats.excludedPhotos}
        hint={stats.excludedPhotos > 0 ? 'missing / invalid capture time' : 'none'}
      />
      <Stat label="Segments" value={stats.segmentCount} />
      <Stat
        label="Average / segment"
        value={stats.averagePhotosPerSegment ? stats.averagePhotosPerSegment.toFixed(1) : '0'}
      />
      <Stat
        label="Largest segment"
        value={stats.largestSegment ? `${stats.largestSegment.photoCount} photos` : '—'}
        hint={stats.largestSegment ? `S${String(stats.largestSegment.index).padStart(2, '0')}` : ''}
      />
      <Stat
        label="Smallest segment"
        value={stats.smallestSegment ? `${stats.smallestSegment.photoCount} photos` : '—'}
        hint={stats.smallestSegment ? `S${String(stats.smallestSegment.index).padStart(2, '0')}` : ''}
      />
      <Stat
        label="Largest time gap"
        value={stats.largestGapMs > 0 ? formatGap(stats.largestGapMs) : '—'}
        hint={stats.totalSpanMs > 0 ? `Capture span ${formatDuration(stats.totalSpanMs)}` : ''}
      />
    </div>
  );
});

TimelineSummary.displayName = 'TimelineSummary';

export default TimelineSummary;
