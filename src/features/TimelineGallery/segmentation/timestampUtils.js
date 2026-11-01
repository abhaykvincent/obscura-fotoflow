/**
 * Capture timestamp normalization for temporal segmentation.
 *
 * FotoFlow's upload pipeline stores `dateTimeOriginal` as the normalized
 * equivalent of EXIF DateTimeOriginal (ISO string, usually UTC). Older/legacy
 * records may still carry the raw EXIF-ish string, a Firestore Timestamp, a
 * Date, or a numeric epoch. We accept all of those shapes, but we deliberately
 * do NOT fall back to server upload time: a photo without a capture timestamp
 * is reported as excluded instead of pretending it happened at upload time.
 *
 * Timezone policy:
 *   - Values with an explicit offset / Z are used as-is.
 *   - Naive EXIF / ISO values are parsed in the browser's local timezone.
 *     This mirrors how the existing gallery pipeline handles legacy photos.
 *     Mixed-camera timezone drift is therefore possible; segments expose the
 *     normalized epoch values so developers can inspect it.
 *   - Numeric values are treated as epoch milliseconds when >= 1e12, otherwise
 *     as epoch seconds (some legacy EXIF parsers emit seconds).
 */

const EXIF_DATE_RE = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;

const MIN_PLAUSIBLE_CAPTURE_MS = Date.UTC(1900, 0, 1);

export const photoIdentity = (photo) => {
  if (!photo) return '';
  return (
    photo.photoId ||
    photo.id ||
    photo.fileId ||
    photo.url ||
    photo.name ||
    ''
  );
};

/**
 * Parse a single timestamp value into epoch milliseconds.
 * @returns {number|null}
 */
export const parseCaptureTimestamp = (value) => {
  if (value === undefined || value === null || value === '') return null;

  let candidate = value;

  // Firestore Timestamp
  if (typeof candidate?.toDate === 'function') {
    try {
      candidate = candidate.toDate();
    } catch {
      return null;
    }
  }

  if (candidate instanceof Date) {
    const ms = candidate.getTime();
    return Number.isFinite(ms) && ms >= MIN_PLAUSIBLE_CAPTURE_MS ? ms : null;
  }

  if (typeof candidate === 'number') {
    if (!Number.isFinite(candidate)) return null;
    const ms = candidate >= 1e12 ? candidate : candidate * 1000;
    return ms >= MIN_PLAUSIBLE_CAPTURE_MS ? Math.round(ms) : null;
  }

  if (typeof candidate !== 'string') return null;

  const trimmed = candidate.trim();
  if (!trimmed) return null;

  // Numeric strings (legacy imports)
  if (/^\d+$/.test(trimmed)) {
    return parseCaptureTimestamp(Number(trimmed));
  }

  // Only raw EXIF dates use colons in the date part. ISO strings with an
  // explicit timezone / offset pass through untouched so they keep their zone.
  const exif = trimmed.match(EXIF_DATE_RE);
  const normalized = exif
    ? `${exif[1]}-${exif[2]}-${exif[3]}T${exif[4]}:${exif[5]}:${exif[6] || '00'}`
    : trimmed;

  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) return null;
  return ms >= MIN_PLAUSIBLE_CAPTURE_MS ? ms : null;
};

/**
 * Resolve the best available capture timestamp for a photo.
 * @returns {{ timestamp: number, source: string }|null}
 */
export const resolveCaptureTimestamp = (photo) => {
  if (!photo) return null;

  const candidates = [
    ['dateTimeOriginal', photo.dateTimeOriginal],
    ['captureTime', photo.captureTime],
    ['takenAt', photo.takenAt],
    ['metadata.dateTimeOriginal', photo.metadata?.dateTimeOriginal],
    ['exif.DateTimeOriginal', photo.exif?.DateTimeOriginal],
    ['exif.dateTimeOriginal', photo.exif?.dateTimeOriginal],
  ];

  for (const [source, value] of candidates) {
    const timestamp = parseCaptureTimestamp(value);
    if (timestamp !== null) return { timestamp, source };
  }

  return null;
};

export const formatDateTime = (ms) => {
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatTime = (ms) => {
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Human-readable duration. Long durations are intentionally coarse so the
 * timeline stays scannable.
 */
export const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatGap = (ms) => {
  if (!Number.isFinite(ms)) return '—';
  if (ms <= 0) return '0s (same moment)';
  return formatDuration(ms);
};
