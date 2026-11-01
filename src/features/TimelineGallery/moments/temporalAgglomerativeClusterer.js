/**
 * Temporal-Constrained Agglomerative Clustering (React-free).
 *
 * The number of moments is never supplied. Clusters start as single photos and
 * only adjacent clusters (in capture order) can merge. A binary heap keeps the
 * best candidate merge on top, so each merge only re-evaluates its two new
 * neighbours instead of rebuilding a full pairwise distance matrix.
 *
 * Complexity: O(n log n) candidate operations for n photos in one temporal
 * segment, with one centroid distance per adjacency check.
 */

import { cosineDistance, normalizeVector } from './visualDistanceCalculator';

class MinHeap {
  constructor(compare) {
    this.items = [];
    this.compare = compare;
  }

  get size() {
    return this.items.length;
  }

  push(item) {
    const items = this.items;
    items.push(item);
    let index = items.length - 1;

    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(items[parent], items[index]) <= 0) break;
      [items[parent], items[index]] = [items[index], items[parent]];
      index = parent;
    }
  }

  pop() {
    const items = this.items;
    if (items.length === 0) return null;

    const top = items[0];
    const last = items.pop();
    if (items.length === 0) return top;

    items[0] = last;
    let index = 0;

    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (left < items.length && this.compare(items[left], items[smallest]) < 0) smallest = left;
      if (right < items.length && this.compare(items[right], items[smallest]) < 0) smallest = right;
      if (smallest === index) break;

      [items[index], items[smallest]] = [items[smallest], items[index]];
      index = smallest;
    }

    return top;
  }
}

const compareEdges = (a, b) => {
  if (a.score !== b.score) return a.score - b.score;
  if (a.leftStart !== b.leftStart) return a.leftStart - b.leftStart;
  return String(a.leftId).localeCompare(String(b.leftId));
};

const buildCluster = (id, entries, version, sumOverride = null) => {
  let sum = sumOverride;
  if (!sum && entries.length > 0 && entries[0].vector) {
    sum = new Array(entries[0].vector.length).fill(0);
    entries.forEach((entry) => {
      for (let i = 0; i < sum.length; i += 1) sum[i] += entry.vector[i];
    });
  }

  return {
    id,
    version,
    entries,
    start: entries[0].timestamp,
    end: entries[entries.length - 1].timestamp,
    sum,
    centroid: sum ? normalizeVector(sum) : null,
    prevId: null,
    nextId: null,
  };
};

/**
 * @param {Array<{photoId:string,timestamp:number,vector:number[],photo:Object}>} entries
 * @param {{ detector: ReturnType<import('./momentBoundaryDetector').createMomentBoundaryDetector>, temporalScaleMs: number }} options
 */
export const clusterTemporally = (entries = [], { detector, temporalScaleMs }) => {
  const diagnostics = {
    mergeCount: 0,
    rejectedEdges: 0,
    temporalScaleMs,
    finalClusterCount: entries.length,
  };

  if (entries.length === 0) {
    return { clusters: [], diagnostics };
  }

  const active = new Map();
  const orderedEntries = [...entries].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.originalIndex - b.originalIndex;
  });

  const initialClusters = orderedEntries.map((entry, index) => (
    buildCluster(`c${index}`, [entry], 0)
  ));

  initialClusters.forEach((cluster, index) => {
    active.set(cluster.id, cluster);
    if (index > 0) cluster.prevId = initialClusters[index - 1].id;
    if (index < initialClusters.length - 1) cluster.nextId = initialClusters[index + 1].id;
  });

  const heap = new MinHeap(compareEdges);
  let nextClusterId = initialClusters.length;

  const evaluatePair = (left, right) => {
    const gapMs = Math.max(0, right.start - left.end);
    const visualDistance = left.centroid && right.centroid
      ? cosineDistance(left.centroid, right.centroid)
      : null;

    const decision = detector.evaluate({ visualDistance, gapMs });

    return {
      leftId: left.id,
      rightId: right.id,
      leftVersion: left.version,
      rightVersion: right.version,
      leftStart: left.start,
      score: decision.accepted ? decision.score : Infinity,
      decision,
      gapMs,
    };
  };

  const pushPair = (leftId) => {
    if (!leftId) return;
    const left = active.get(leftId);
    if (!left || !left.nextId) return;
    const right = active.get(left.nextId);
    if (!right) return;

    const edge = evaluatePair(left, right);
    if (edge.decision.accepted) {
      heap.push(edge);
    } else {
      diagnostics.rejectedEdges += 1;
    }
  };

  for (let i = 0; i < initialClusters.length - 1; i += 1) {
    pushPair(initialClusters[i].id);
  }

  while (heap.size > 0) {
    const edge = heap.pop();
    const left = active.get(edge.leftId);
    const right = active.get(edge.rightId);

    // Lazy invalidation: clusters may have merged since this edge was queued.
    if (
      !left
      || !right
      || left.version !== edge.leftVersion
      || right.version !== edge.rightVersion
      || left.nextId !== right.id
    ) {
      continue;
    }

    const prevId = left.prevId;
    const nextId = right.nextId;
    const mergedId = `c${nextClusterId}`;
    nextClusterId += 1;

    let mergedSum = null;
    if (left.sum && right.sum) {
      mergedSum = new Array(left.sum.length);
      for (let i = 0; i < left.sum.length; i += 1) {
        mergedSum[i] = left.sum[i] + right.sum[i];
      }
    }

    const merged = buildCluster(
      mergedId,
      left.entries.concat(right.entries),
      Math.max(left.version, right.version) + 1,
      mergedSum,
    );
    merged.prevId = prevId;
    merged.nextId = nextId;
    merged.centroid = normalizeVector(merged.sum) || left.centroid || right.centroid;

    active.delete(left.id);
    active.delete(right.id);
    active.set(merged.id, merged);

    if (prevId) {
      const prev = active.get(prevId);
      if (prev) prev.nextId = mergedId;
    }
    if (nextId) {
      const next = active.get(nextId);
      if (next) next.prevId = mergedId;
    }

    diagnostics.mergeCount += 1;

    // Only the two new adjacencies can produce new candidate merges.
    pushPair(prevId);
    pushPair(mergedId);
  }

  // Traverse from head to preserve chronological order.
  const clusters = [];
  let head = [...active.values()].find((cluster) => !cluster.prevId);
  while (head) {
    clusters.push(head);
    head = head.nextId ? active.get(head.nextId) : null;
  }

  diagnostics.finalClusterCount = clusters.length;
  return { clusters, diagnostics };
};
