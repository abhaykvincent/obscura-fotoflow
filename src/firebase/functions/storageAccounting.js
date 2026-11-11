/**
 * Studio storage accounting boundary.
 *
 * All writes to `studios/{domain}.usage.storage.used` MUST go through this
 * module. Source sizes are bytes; studio usage is decimal MB.
 */

import { increment } from 'firebase/firestore';
import { bytesToMB, toByteSize } from '../../utils/storageUnits';

export const STORAGE_ACCOUNTING_OPERATIONS = Object.freeze({
    PHOTO_CREATE: 'photo-create',
    PHOTO_DELETE: 'photo-delete',
    PROJECT_DELETE: 'project-delete',
    PROJECT_ARCHIVE: 'project-archive',
    PROJECT_RESTORE: 'project-restore',
    MIGRATION: 'migration',
    RECONCILIATION: 'reconciliation',
});

const logStorageAccounting = (payload) => {
    console.info('[storage-accounting]', payload);
};

/**
 * Computes the signed studio usage delta in MB from a byte size.
 * Pure helper, exposed for verification and tests.
 */
export const computeStudioStorageDeltaMB = (bytes, { direction = 'increment' } = {}) => {
    const byteSize = toByteSize(bytes, 'storage byte size');
    const deltaMB = bytesToMB(byteSize, 'storage byte size');
    return direction === 'decrement' ? -deltaMB : deltaMB;
};

/**
 * Builds the Firestore field update for a studio storage delta.
 *
 * @param {number} bytes - source size in bytes
 * @param {Object} context
 * @param {string} context.operation - one of STORAGE_ACCOUNTING_OPERATIONS
 * @param {'increment'|'decrement'} [context.direction]
 * @param {string} [context.domain]
 * @param {string} [context.projectId]
 * @param {string} [context.photoId]
 * @param {string} [context.idempotency]
 * @param {string} [context.reason]
 * @returns {{'usage.storage.used': *}}
 */
export const buildStudioStorageUpdate = (bytes, {
    operation,
    direction = 'increment',
    domain,
    projectId,
    photoId,
    idempotency = 'applied',
    reason,
} = {}) => {
    const byteSize = toByteSize(bytes, 'storage byte size');
    const deltaMB = computeStudioStorageDeltaMB(byteSize, { direction });

    logStorageAccounting({
        studioId: domain,
        projectId,
        photoId,
        operation,
        originalBytes: byteSize,
        deltaMB,
        idempotency,
        reason,
    });

    return {
        'usage.storage.used': increment(deltaMB),
    };
};

/**
 * Emits a structured accounting outcome/diagnostic record.
 */
export const logStorageAccountingOutcome = (payload) => {
    logStorageAccounting(payload);
};
