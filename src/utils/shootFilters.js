/**
 * Frontend-only deduplication for the Shoots tab/grid.
 * Does NOT alter Firestore data — purely a pre-render client-side filter.
 */

const isSameCalendarDate = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
};

export const filterShootsWithThreshold = (shoots, thresholdHours = 6, sortOrder = 'asc') => {
    if (!shoots || shoots.length === 0) return [];

    // 1. First filter out shoots without filesCount or with filesCount = 0.
    // A shoot card is only rendered when filesCount is present and > 0.
    const validShoots = shoots.filter((shoot) =>
        shoot.filesCount !== undefined &&
        shoot.filesCount !== null &&
        shoot.filesCount > 0
    );
    if (validShoots.length === 0) return [];

    // 2. Sort remaining shoots chronologically (copy — never mutates input)
    const sorted = [...validShoots].sort((a, b) => {
        const diff = new Date(a.date) - new Date(b.date);
        return sortOrder === 'desc' ? -diff : diff;
    });
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const filtered = [];

    sorted.forEach((shoot) => {
        if (filtered.length === 0) {
            filtered.push(shoot);
            return;
        }

        const lastKept = filtered[filtered.length - 1];

        // Different calendar dates are always kept as separate shoot cards.
        if (!isSameCalendarDate(shoot.date, lastKept.date)) {
            filtered.push(shoot);
            return;
        }

        // Same calendar date: hide the duplicate when it falls within the
        // threshold window of the last *kept* shoot on that date.
        const timeDiff = Math.abs(new Date(shoot.date) - new Date(lastKept.date));

        // Keep if time difference >= threshold (e.g. 6 hours / 21,600,000 ms)
        if (timeDiff >= thresholdMs) {
            filtered.push(shoot);
        }
        // ELSE: filter it out (hide duplicate) — DB untouched.
    });

    return filtered;
};

/**
 * Default wrapper used by the Shoots grid components.
 * Requires filesCount > 0 AND hides shoots on the same calendar date
 * within 6 hours of the last kept shoot, without modifying Firestore data.
 */
export const filterDuplicateShoots = (shoots, sortOrder = 'asc') =>
    filterShootsWithThreshold(shoots, 6, sortOrder);

/**
 * Alias matching the reference implementation name.
 * Both conditions must pass: filesCount > 0 + 6-hour gap threshold.
 */
export const filterShoots = (shoots, thresholdHours = 6) =>
    filterShootsWithThreshold(shoots, thresholdHours, 'asc');

export default filterDuplicateShoots;
