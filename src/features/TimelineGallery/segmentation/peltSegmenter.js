/**
 * Strategy B — PELT-Based Segmentation (Experimental).
 *
 * True PELT (Pruned Exact Linear Time) over the series of inter-photo gaps,
 * not a disguised fixed threshold:
 *
 *   series[i] = log1p(gap between photo i and i+1, in minutes)
 *   cost(s, t) = mean squared deviation of series[s..t) from its own mean
 *   objective  = sum(segment costs) + penalty * number_of_segments
 *
 * The logarithmic transform keeps short bursts and long inactivity gaps on a
 * comparable scale; the MSE cost lets PELT find rhythm changes without a
 * predefined number of segments. PELT is exact for this cost and uses the
 * standard pruning rule to avoid evaluating every candidate.
 *
 * Penalty is expressed in MSE units (not an arbitrary time threshold). Raise it
 * to produce fewer, broader segments; lower it to expose more change points.
 */

const EPSILON = 1e-9;

const buildPrefixSums = (series) => {
  const n = series.length;
  const sum = new Float64Array(n + 1);
  const sumSq = new Float64Array(n + 1);

  for (let i = 0; i < n; i += 1) {
    sum[i + 1] = sum[i] + series[i];
    sumSq[i + 1] = sumSq[i] + series[i] * series[i];
  }

  return { sum, sumSq };
};

const makeCostFunction = (series) => {
  const { sum, sumSq } = buildPrefixSums(series);

  // Mean squared deviation for segment [start, end)
  return (start, end) => {
    const length = end - start;
    if (length <= 0) return 0;
    const total = sum[end] - sum[start];
    const totalSq = sumSq[end] - sumSq[start];
    const mean = total / length;
    const variance = totalSq / length - mean * mean;
    return Math.max(0, variance);
  };
};

/**
 * Run PELT over a numeric series and return change-point indices.
 * A change point `i` means a new data segment starts at series[i].
 */
export const peltChangePoints = (series, { penalty = 0.5, minSegmentSize = 3 } = {}) => {
  const n = series.length;
  if (n === 0) return [];
  if (n < Math.max(2, minSegmentSize)) return [];

  const beta = Math.max(0, Number(penalty) || 0);
  const minSize = Math.max(1, Math.floor(minSegmentSize));
  const cost = makeCostFunction(series);

  const objective = new Float64Array(n + 1).fill(Number.POSITIVE_INFINITY);
  const lastChange = new Int32Array(n + 1);

  // F(0) = -beta so the first segment does not pay a penalty.
  objective[0] = -beta;

  let candidates = [0];

  for (let t = 1; t <= n; t += 1) {
    let best = Number.POSITIVE_INFINITY;
    let bestStart = 0;

    for (let i = 0; i < candidates.length; i += 1) {
      const s = candidates[i];
      if (t - s < minSize) continue;

      const value = objective[s] + cost(s, t) + beta;
      if (value < best) {
        best = value;
        bestStart = s;
      }
    }

    objective[t] = best;
    lastChange[t] = bestStart;

    // Standard PELT pruning: discard candidates that can never be optimal
    // for any future t. The MSE cost is additive, so this is safe.
    const nextCandidates = [];
    for (let i = 0; i < candidates.length; i += 1) {
      const s = candidates[i];
      if (t - s < minSize) {
        nextCandidates.push(s);
        continue;
      }
      if (objective[s] + cost(s, t) + beta <= objective[t] + EPSILON) {
        nextCandidates.push(s);
      }
    }
    nextCandidates.push(t);
    candidates = nextCandidates;
  }

  const changes = [];
  let cursor = n;
  let guard = 0;

  while (cursor > 0 && guard <= n) {
    const previous = lastChange[cursor];
    if (previous > 0) changes.push(previous);
    if (previous === cursor) break;
    cursor = previous;
    guard += 1;
  }

  return changes.reverse();
};

/**
 * @param {Array<{ timestamp: number }>} sortedPhotos
 * @param {{ penalty?: number, minSegmentSize?: number }} options
 * @returns {Array<Array<{ timestamp: number }>>}
 */
export const segmentByPelt = (sortedPhotos = [], { penalty = 0.5, minSegmentSize = 3 } = {}) => {
  if (sortedPhotos.length === 0) return [];
  if (sortedPhotos.length < 3) return [sortedPhotos];

  const gapsInMinutes = [];
  for (let i = 1; i < sortedPhotos.length; i += 1) {
    const gapMinutes = Math.max(0, sortedPhotos[i].timestamp - sortedPhotos[i - 1].timestamp) / 60000;
    gapsInMinutes.push(Math.log1p(gapMinutes));
  }

  const changePoints = peltChangePoints(gapsInMinutes, { penalty, minSegmentSize });

  // A change point at gap index `p` is the transition between photo p and
  // p + 1, so the next photo segment starts at p + 1.
  const splitIndices = changePoints
    .map((p) => p + 1)
    .filter((index) => index > 0 && index < sortedPhotos.length);

  if (splitIndices.length === 0) return [sortedPhotos];

  const groups = [];
  let start = 0;
  splitIndices.forEach((split) => {
    groups.push(sortedPhotos.slice(start, split));
    start = split;
  });
  groups.push(sortedPhotos.slice(start));

  return groups.filter((group) => group.length > 0);
};
