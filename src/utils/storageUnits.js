/**
 * Storage unit contract.
 *
 * Source sizes (browser `File.size`, photo `originalSize`, project
 * `totalFileSize`) are always bytes. Studio usage/quota is always decimal MB.
 * 1 MB = 1,000,000 bytes (never MiB).
 */

export const BYTES_PER_MB = 1_000_000;

/**
 * Validates and normalizes a byte value.
 *
 * Missing values are treated as zero. Anything else must be a finite,
 * non-negative number (numeric strings are accepted for legacy documents).
 *
 * @param {*} value
 * @param {string} [fieldName]
 * @returns {number} byte value
 */
export const toByteSize = (value, fieldName = 'size') => {
    if (value === undefined || value === null || value === '') {
        return 0;
    }

    const numeric = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(numeric) || numeric < 0) {
        throw new RangeError(`${fieldName} must be a finite non-negative number of bytes.`);
    }

    return numeric;
};

/**
 * Converts bytes to decimal megabytes.
 *
 * @param {*} bytes
 * @param {string} [fieldName]
 * @returns {number} MB
 */
export const bytesToMB = (bytes, fieldName = 'size') =>
    toByteSize(bytes, fieldName) / BYTES_PER_MB;

/**
 * Converts decimal megabytes to bytes.
 *
 * @param {*} mb
 * @param {string} [fieldName]
 * @returns {number} bytes
 */
export const mbToBytes = (mb, fieldName = 'sizeMb') => {
    if (mb === undefined || mb === null || mb === '') {
        return 0;
    }

    const numeric = typeof mb === 'number' ? mb : Number(mb);

    if (!Number.isFinite(numeric) || numeric < 0) {
        throw new RangeError(`${fieldName} must be a finite non-negative number of megabytes.`);
    }

    return numeric * BYTES_PER_MB;
};

/**
 * True when the value can safely be used as a byte size.
 */
export const isValidByteSize = (value) => {
    try {
        toByteSize(value);
        return true;
    } catch (error) {
        return false;
    }
};
