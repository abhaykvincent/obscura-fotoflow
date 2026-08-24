import {
    selectUploadSession,
    selectUploadStatus,
    selectUploadFilesMap,
    selectUploadFilesArray,
    selectFileProgress,
    selectSessionProgress,
    selectSessionBytes,
    selectCompletedFiles,
    selectFailedFiles,
    selectProcessingFiles,
    selectUploadingFiles,
    selectTotalFilesCount,
    selectCompletedFilesCount,
    selectUploadList,
    calculateFileProgress,
} from './uploadSelectors';
import {
    UPLOAD_PARENT_STATES,
    UPLOAD_DERIVATIVE_STATES,
    UPLOAD_SESSION_STATUS,
    PROCESSING_STEPS,
} from './uploadConstants';

describe('Upload Selectors & Progress Calculation (FF-UPLOAD-17)', () => {
    test('calculateFileProgress returns 0 for pending and 100 for completed', () => {
        expect(calculateFileProgress(null)).toBe(0);
        expect(calculateFileProgress({ state: UPLOAD_PARENT_STATES.PENDING })).toBe(0);
        expect(calculateFileProgress({ state: UPLOAD_PARENT_STATES.COMPLETED })).toBe(100);
        expect(calculateFileProgress({ status: 'uploaded' })).toBe(100);
    });

    test('calculateFileProgress scales processing state between 0% and 10%', () => {
        const file = {
            state: UPLOAD_PARENT_STATES.PROCESSING,
            processing: { step: PROCESSING_STEPS.EXIF, progress: 50 },
        };
        const progress = calculateFileProgress(file);
        expect(progress).toBe(5); // 50% of 10%
    });

    test('calculateFileProgress scales uploading derivatives between 10% and 95%', () => {
        const file = {
            state: UPLOAD_PARENT_STATES.UPLOADING,
            derivatives: {
                web: { bytesTransferred: 500, totalBytes: 1000, status: UPLOAD_DERIVATIVE_STATES.UPLOADING },
                thumb: { bytesTransferred: 500, totalBytes: 1000, status: UPLOAD_DERIVATIVE_STATES.UPLOADING },
            }
        };
        // Total transferred = 1000 / 2000 = 50% upload ratio
        // Scaled: 10 + 0.5 * 85 = 52.5%
        const progress = calculateFileProgress(file);
        expect(progress).toBeCloseTo(52.5, 1);
    });

    test('calculateFileProgress returns 96% during verification phase', () => {
        const file = {
            state: UPLOAD_PARENT_STATES.VERIFYING,
            derivatives: {
                web: { status: UPLOAD_DERIVATIVE_STATES.COMPLETED, totalBytes: 1000, bytesTransferred: 1000 },
                thumb: { status: UPLOAD_DERIVATIVE_STATES.COMPLETED, totalBytes: 200, bytesTransferred: 200 },
            }
        };
        expect(calculateFileProgress(file)).toBe(96);
    });

    test('FF-UPLOAD-08: Byte-weighted session progress handles 1MB file vs 100MB file', () => {
        // Acceptance criteria:
        // 1 MB file -> 100% completed (1,000,000 bytes)
        // 100 MB file -> 0% completed (0 / 100,000,000 bytes)
        // Global progress must produce ~ 1 / 101 = 0.99%, NOT 50%!
        const state = {
            upload: {
                session: { id: 's1', status: UPLOAD_SESSION_STATUS.OPEN },
                files: {
                    'small-file': {
                        id: 'small-file',
                        name: 'small.jpg',
                        state: UPLOAD_PARENT_STATES.COMPLETED,
                        derivatives: {
                            web: { totalBytes: 900000, bytesTransferred: 900000, status: UPLOAD_DERIVATIVE_STATES.COMPLETED },
                            thumb: { totalBytes: 100000, bytesTransferred: 100000, status: UPLOAD_DERIVATIVE_STATES.COMPLETED },
                        }
                    },
                    'large-file': {
                        id: 'large-file',
                        name: 'large.jpg',
                        state: UPLOAD_PARENT_STATES.UPLOADING,
                        derivatives: {
                            web: { totalBytes: 90000000, bytesTransferred: 0, status: UPLOAD_DERIVATIVE_STATES.UPLOADING },
                            thumb: { totalBytes: 10000000, bytesTransferred: 0, status: UPLOAD_DERIVATIVE_STATES.UPLOADING },
                        }
                    }
                }
            }
        };

        const sessionBytes = selectSessionBytes(state);
        expect(sessionBytes.totalBytes).toBe(101000000);
        expect(sessionBytes.bytesTransferred).toBe(1000000);

        const sessionProgress = selectSessionProgress(state);
        // (1,000,000 / 101,000,000) * 100 = 0.990099...%
        expect(sessionProgress).toBeCloseTo(0.99, 1);
        expect(sessionProgress).toBeLessThan(2);
    });

    test('selectSessionProgress returns 100 when session is completed', () => {
        const state = {
            upload: {
                session: { id: 's1', status: UPLOAD_SESSION_STATUS.COMPLETED },
                files: {
                    'f1': { id: 'f1', state: UPLOAD_PARENT_STATES.COMPLETED }
                }
            }
        };
        expect(selectSessionProgress(state)).toBe(100);
    });

    test('filtered file selectors return correct arrays and counts', () => {
        const state = {
            upload: {
                session: { id: 's1', status: UPLOAD_SESSION_STATUS.OPEN },
                files: {
                    'f1': { id: 'f1', state: UPLOAD_PARENT_STATES.COMPLETED },
                    'f2': { id: 'f2', state: UPLOAD_PARENT_STATES.PROCESSING },
                    'f3': { id: 'f3', state: UPLOAD_PARENT_STATES.UPLOADING },
                    'f4': { id: 'f4', state: UPLOAD_PARENT_STATES.FAILED },
                }
            }
        };

        expect(selectTotalFilesCount(state)).toBe(4);
        expect(selectCompletedFilesCount(state)).toBe(1);
        expect(selectCompletedFiles(state).length).toBe(1);
        expect(selectProcessingFiles(state).length).toBe(1);
        expect(selectUploadingFiles(state).length).toBe(1);
        expect(selectFailedFiles(state).length).toBe(1);
    });

    test('selectUploadList provides backwards compatibility', () => {
        const state = {
            upload: {
                files: {
                    'f1': {
                        id: 'f1',
                        name: 'pic.jpg',
                        state: UPLOAD_PARENT_STATES.COMPLETED,
                        urls: { web: 'https://cdn.com/w.jpg', thumb: 'https://cdn.com/t.jpg' },
                        derivatives: {
                            web: { totalBytes: 100, bytesTransferred: 100, status: 'completed' },
                            thumb: { totalBytes: 50, bytesTransferred: 50, status: 'completed' },
                        }
                    }
                }
            }
        };

        const list = selectUploadList(state);
        expect(list['f1']).toBeDefined();
        expect(list['f1'].status).toBe('completed');
        expect(list['f1'].progress).toBe(100);
        expect(list['f1'].url).toBe('https://cdn.com/w.jpg');
        expect(list['f1'].thumbUrl).toBe('https://cdn.com/t.jpg');
        expect(list['f1'].uploadParts.web).toBeDefined();
    });
});
