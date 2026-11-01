import { memo } from 'react';

const Stat = ({ label, value, hint }) => (
  <div className="timeline-stat">
    <span className="timeline-stat-label">{label}</span>
    <strong className="timeline-stat-value">{value}</strong>
    {hint && <span className="timeline-stat-hint">{hint}</span>}
  </div>
);

const MomentDetectionSummary = memo(({ stats, config }) => {
  if (!stats) return null;

  const largest = stats.largestMoment;
  const smallest = stats.smallestMoment;
  const embedCoverage = stats.totalPhotosInSegments > 0
    ? (stats.photosWithEmbeddings / stats.totalPhotosInSegments) * 100
    : 0;

  return (
    <div className="timeline-summary moment-summary" aria-label="Moment detection summary">
      <Stat label="Photos in segments" value={stats.totalPhotosInSegments.toLocaleString()} />
      <Stat
        label="Valid embeddings"
        value={stats.photosWithEmbeddings.toLocaleString()}
        hint={`${embedCoverage.toFixed(0)}% coverage`}
      />
      <Stat
        label="Without embeddings"
        value={stats.photosWithoutEmbeddings.toLocaleString()}
        hint={stats.photosWithoutEmbeddings > 0 ? 'unassigned, never zero-filled' : 'none'}
      />
      <Stat label="Moments detected" value={stats.totalMoments.toLocaleString()} />
      <Stat
        label="Average / Moment"
        value={stats.totalMoments > 0 ? stats.averagePhotosPerMoment.toFixed(1) : '0'}
      />
      <Stat
        label="Largest Moment"
        value={largest ? `${largest.photoCount} photos` : '—'}
        hint={largest ? `S${String(largest.segmentIndex).padStart(2, '0')} · ${largest.label}` : ''}
      />
      <Stat
        label="Smallest Moment"
        value={smallest ? `${smallest.photoCount} photos` : '—'}
        hint={smallest ? `S${String(smallest.segmentIndex).padStart(2, '0')} · ${smallest.label}` : ''}
      />
      <Stat label="Singleton Moments" value={stats.singletonMoments} />
      <Stat
        label="Unassigned photos"
        value={stats.unassignedPhotos.toLocaleString()}
        hint={stats.unassignedPhotos > 0 ? 'missing embedding / small cluster' : 'none'}
      />
      <Stat
        label="Segments without Moments"
        value={stats.segmentsWithoutMoments}
        hint={config?.minMomentSize > 1 ? `min ${config.minMomentSize} photos` : 'min 1 photo'}
      />
    </div>
  );
});

MomentDetectionSummary.displayName = 'MomentDetectionSummary';

export default MomentDetectionSummary;
