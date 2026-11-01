/**
 * Strategy A — Time Gap Baseline.
 *
 * Breaks the chronologically sorted photo sequence whenever the gap between
 * two consecutive captures exceeds a configurable threshold. This is the
 * predictable baseline developers can compare experimental strategies against.
 *
 * @param {Array<{ timestamp: number }>} sortedPhotos
 * @param {{ thresholdMinutes?: number }} options
 * @returns {Array<Array<{ timestamp: number }>>}
 */
export const segmentByTimeGap = (sortedPhotos = [], { thresholdMinutes = 30 } = {}) => {
  const thresholdMs = Math.max(0, Number(thresholdMinutes) || 0) * 60 * 1000;

  if (sortedPhotos.length === 0) return [];

  const groups = [];
  let current = [sortedPhotos[0]];

  for (let i = 1; i < sortedPhotos.length; i += 1) {
    const previous = sortedPhotos[i - 1];
    const photo = sortedPhotos[i];
    const gap = photo.timestamp - previous.timestamp;

    if (gap > thresholdMs) {
      groups.push(current);
      current = [photo];
    } else {
      current.push(photo);
    }
  }

  groups.push(current);
  return groups;
};
