/**
 * Deterministic representative-photo sampling (React-free).
 *
 * The goal is a small preview that shows the range of a moment, not four
 * near-identical burst frames. Selection is deterministic for the same inputs
 * and configuration:
 *   1. seed with the photo closest to the cluster centroid
 *   2. repeatedly add the photo that is furthest from the already selected set
 *   3. break every tie on timestamp then photoId
 *
 * This sampler is intentionally independent of React and of the moment engine
 * so the next Photo Intelligence stage can reuse it.
 */

import { cosineDistance, averageVector, normalizeVector } from './visualDistanceCalculator';

const compareEntries = (a, b) => {
  if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
  return String(a.photoId).localeCompare(String(b.photoId));
};

const evenlySpaced = (entries, count) => {
  if (entries.length <= count) return [...entries];
  const selected = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.round((i * (entries.length - 1)) / (count - 1));
    selected.push(entries[index]);
  }
  return selected;
};

/**
 * @param {Array<{photoId:string,timestamp:number,vector:number[],photo:Object}>} entries
 * @param {{ count?: number }} options
 * @returns {Object[]} original photo objects, in chronological order
 */
export const sampleRepresentativePhotos = (entries = [], { count = 4 } = {}) => {
  const target = Math.max(1, Math.round(Number(count) || 1));
  const ordered = [...entries].sort(compareEntries);
  if (ordered.length === 0) return [];
  if (ordered.length <= target) return ordered.map((entry) => entry.photo);

  const withVectors = ordered.every((entry) => Array.isArray(entry.vector));
  if (!withVectors) {
    return evenlySpaced(ordered, target).map((entry) => entry.photo);
  }

  const centroid = normalizeVector(averageVector(ordered.map((entry) => entry.vector)));
  if (!centroid) {
    return evenlySpaced(ordered, target).map((entry) => entry.photo);
  }

  const selected = [];
  const selectedIds = new Set();

  // Seed: the most central frame (medoid proxy).
  let seed = ordered[0];
  let seedDistance = Infinity;
  ordered.forEach((entry) => {
    const distance = cosineDistance(entry.vector, centroid);
    if (
      distance < seedDistance - 1e-12
      || (Math.abs(distance - seedDistance) <= 1e-12 && compareEntries(entry, seed) < 0)
    ) {
      seed = entry;
      seedDistance = distance;
    }
  });
  selected.push(seed);
  selectedIds.add(seed.photoId);

  while (selected.length < target) {
    let best = null;
    let bestMinDistance = -Infinity;

    ordered.forEach((entry) => {
      if (selectedIds.has(entry.photoId)) return;

      let minDistance = Infinity;
      selected.forEach((chosen) => {
        const distance = cosineDistance(entry.vector, chosen.vector);
        if (distance < minDistance) minDistance = distance;
      });

      if (
        minDistance > bestMinDistance + 1e-12
        || (Math.abs(minDistance - bestMinDistance) <= 1e-12 && best && compareEntries(entry, best) < 0)
      ) {
        best = entry;
        bestMinDistance = minDistance;
      }
    });

    if (!best) break;
    selected.push(best);
    selectedIds.add(best.photoId);
  }

  return selected.sort(compareEntries).map((entry) => entry.photo);
};
