import { createSelector } from '@reduxjs/toolkit';
import { 
    UPLOAD_PARENT_STATES, 
    UPLOAD_DERIVATIVE_STATES, 
    UPLOAD_SESSION_STATUS,
    REQUIRED_DERIVATIVES 
} from './uploadConstants';

/**
 * Basic state selectors
 */
export const selectUploadState = (state) => state.upload;

export const selectUploadSession = createSelector(
    [selectUploadState],
    (upload) => upload?.session || { id: null, status: UPLOAD_SESSION_STATUS.CLOSE }
);

export const selectUploadStatus = createSelector(
    [selectUploadSession, selectUploadState],
    (session, upload) => session?.status || upload?.uploadStatus || UPLOAD_SESSION_STATUS.CLOSE
);

export const selectUploadFilesMap = createSelector(
    [selectUploadState],
    (upload) => upload?.files || upload?.uploadList || {}
);

export const selectUploadFilesArray = createSelector(
    [selectUploadFilesMap],
    (filesMap) => Object.values(filesMap || {})
);

/**
 * File specific selectors
 */
export const selectFileById = (state, fileId) => {
    const files = selectUploadFilesMap(state);
    return files ? files[fileId] : undefined;
};

/**
 * Calculates a single file's progress (0-100) deterministically from facts.
 * 
 * Breakdown:
 * - Preparation / Processing: 0% - 10%
 * - Derivative Upload: 10% - 95%
 * - Verification: 95% - 99%
 * - Completed: 100%
 */
export const calculateFileProgress = (file) => {
    if (!file) return 0;
    
    if (file.state === UPLOAD_PARENT_STATES.COMPLETED || file.status === 'uploaded' || file.status === 'completed') {
        return 100;
    }

    if (file.state === UPLOAD_PARENT_STATES.VERIFYING) {
        return 96;
    }

    if (file.state === UPLOAD_PARENT_STATES.PROCESSING) {
        const proc = file.processing || {};
        const stepProgress = typeof proc.progress === 'number' ? proc.progress : 50;
        return Math.min(10, Math.max(1, (stepProgress / 100) * 10));
    }

    if (file.state === UPLOAD_PARENT_STATES.UPLOADING || file.status === 'uploading') {
        const derivatives = file.derivatives || file.uploadParts || {};
        const parts = Object.values(derivatives);
        
        if (parts.length === 0) return 10;

        const totalBytes = parts.reduce((sum, p) => sum + (p.totalBytes || 0), 0);
        let uploadRatio = 0;

        if (totalBytes > 0) {
            const transferred = parts.reduce((sum, p) => {
                if (p.status === UPLOAD_DERIVATIVE_STATES.COMPLETED || p.status === 'uploaded') {
                    return sum + (p.totalBytes || p.bytesTransferred || 0);
                }
                return sum + (p.bytesTransferred || 0);
            }, 0);
            uploadRatio = transferred / totalBytes;
        } else {
            const progressSum = parts.reduce((sum, p) => sum + (p.progress || 0), 0);
            uploadRatio = progressSum / (parts.length * 100);
        }

        // Scale upload ratio (0 to 1) into (10% to 95%) range
        const progress = 10 + (Math.min(1, Math.max(0, uploadRatio)) * 85);
        return Math.min(95, Math.max(10, progress));
    }

    if (file.state === UPLOAD_PARENT_STATES.FAILED || file.status === 'failed') {
        return 0;
    }

    return 0; // PENDING
};

export const selectFileProgress = (state, fileId) => {
    const file = selectFileById(state, fileId);
    return calculateFileProgress(file);
};

export const selectFileStatus = (state, fileId) => {
    const file = selectFileById(state, fileId);
    return file?.state || file?.status || UPLOAD_PARENT_STATES.PENDING;
};

export const selectDerivativeProgress = (state, fileId, derivativeType) => {
    const file = selectFileById(state, fileId);
    if (!file) return 0;
    const deriv = (file.derivatives && file.derivatives[derivativeType]) || 
                  (file.uploadParts && file.uploadParts[derivativeType]);
    if (!deriv) return 0;
    if (deriv.status === UPLOAD_DERIVATIVE_STATES.COMPLETED || deriv.status === 'uploaded') return 100;
    if (deriv.totalBytes > 0) {
        return Math.min(100, Math.round(((deriv.bytesTransferred || 0) / deriv.totalBytes) * 100));
    }
    return deriv.progress || 0;
};

/**
 * Session byte metrics
 */
export const selectSessionBytes = createSelector(
    [selectUploadFilesArray],
    (files) => {
        let bytesTransferred = 0;
        let totalBytes = 0;

        files.forEach((file) => {
            const derivatives = file.derivatives || file.uploadParts || {};
            const parts = Object.values(derivatives);

            if (parts.length > 0) {
                parts.forEach((p) => {
                    const partTotal = p.totalBytes || 0;
                    totalBytes += partTotal;

                    if (p.status === UPLOAD_DERIVATIVE_STATES.COMPLETED || p.status === 'uploaded') {
                        bytesTransferred += partTotal > 0 ? partTotal : (p.bytesTransferred || 0);
                    } else {
                        bytesTransferred += (p.bytesTransferred || 0);
                    }
                });
            } else if (file.originalSize || file.size) {
                // Fallback to original size if derivatives not yet registered
                const orig = file.originalSize || file.size || 0;
                totalBytes += orig;
                if (file.state === UPLOAD_PARENT_STATES.COMPLETED || file.status === 'uploaded') {
                    bytesTransferred += orig;
                }
            }
        });

        return { bytesTransferred, totalBytes };
    }
);

/**
 * Session Progress calculation (Byte-weighted)
 * 
 * Computes global progress from actual derivative transferred bytes vs total derivative bytes.
 * If derivatives are not yet ready (processing stage), blends processing progress proportionally.
 */
export const selectSessionProgress = createSelector(
    [selectUploadFilesArray, selectSessionBytes, selectUploadStatus],
    (files, sessionBytes, status) => {
        if (status === UPLOAD_SESSION_STATUS.COMPLETED || status === 'completed') {
            return 100;
        }
        if (files.length === 0) return 0;

        const { bytesTransferred, totalBytes } = sessionBytes;

        if (totalBytes > 0) {
            const bytePercent = (bytesTransferred / totalBytes) * 100;
            // Cap at 99% until entire session is marked completed
            return Math.min(99, Math.max(0, bytePercent));
        }

        // If derivative total bytes are 0 (e.g. all files in pre-processing), average derived file progress
        const sumFileProgress = files.reduce((sum, f) => sum + calculateFileProgress(f), 0);
        const avg = sumFileProgress / files.length;
        return Math.min(99, Math.max(0, avg));
    }
);

/**
 * Filtered file collection selectors
 */
export const selectCompletedFiles = createSelector(
    [selectUploadFilesArray],
    (files) => files.filter(f => f.state === UPLOAD_PARENT_STATES.COMPLETED || f.status === 'uploaded')
);

export const selectFailedFiles = createSelector(
    [selectUploadFilesArray],
    (files) => files.filter(f => f.state === UPLOAD_PARENT_STATES.FAILED || f.status === 'failed')
);

export const selectProcessingFiles = createSelector(
    [selectUploadFilesArray],
    (files) => files.filter(f => f.state === UPLOAD_PARENT_STATES.PROCESSING)
);

export const selectUploadingFiles = createSelector(
    [selectUploadFilesArray],
    (files) => files.filter(f => f.state === UPLOAD_PARENT_STATES.UPLOADING || f.status === 'uploading')
);

export const selectTotalFilesCount = createSelector(
    [selectUploadFilesArray],
    (files) => files.length
);

export const selectCompletedFilesCount = createSelector(
    [selectCompletedFiles],
    (completed) => completed.length
);

/**
 * Backward compatibility selector for selectUploadList
 * Returns a dictionary where each file has authoritative derived fields
 * along with legacy properties (status, progress, uploadParts, url, thumbUrl).
 */
export const selectUploadList = createSelector(
    [selectUploadFilesMap],
    (filesMap) => {
        if (!filesMap) return {};
        const result = {};
        Object.entries(filesMap).forEach(([id, file]) => {
            const progress = calculateFileProgress(file);
            const status = file.state || file.status || 'pending';
            const url = file.urls?.web || file.url || null;
            const thumbUrl = file.urls?.thumb || file.thumbUrl || null;

            result[id] = {
                ...file,
                id: file.id || id,
                status,
                progress,
                url,
                thumbUrl,
                uploadParts: file.derivatives || file.uploadParts || {
                    web: { status: 'pending', progress: 0, bytesTransferred: 0, totalBytes: 0 },
                    thumb: { status: 'pending', progress: 0, bytesTransferred: 0, totalBytes: 0 },
                },
            };
        });
        return result;
    }
);
