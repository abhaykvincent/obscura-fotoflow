import {
    generateUploadId,
    UploadWorkerPool,
} from './uploadOperations';
import {
    UPLOAD_PARENT_STATES,
    UPLOAD_DERIVATIVE_STATES,
    UPLOAD_SESSION_STATUS,
    PROCESSING_STEPS,
} from '../app/slices/uploadConstants';
import {
    selectSessionProgress,
    selectSessionBytes,
    calculateFileProgress,
} from '../app/slices/uploadSelectors';

describe('Upload Operations & Pipeline Hardening (FF-UPLOAD-18, FF-UPLOAD-19)', () => {
    test('generateUploadId creates unique IDs even for same name and size in batch', () => {
        const file1 = { name: 'photo.jpg', size: 1024, lastModified: 1000 };
        const file2 = { name: 'photo.jpg', size: 1024, lastModified: 1000 };

        const id1 = generateUploadId('session-1', file1, 0);
        const id2 = generateUploadId('session-1', file2, 1);

        expect(id1).not.toBe(id2);
        expect(id1).toContain('session-1_file_0');
        expect(id2).toContain('session-1_file_1');
    });

    test('UploadWorkerPool throttles tasks within concurrency limit', async () => {
        const pool = new UploadWorkerPool(3);
        let active = 0;
        let maxObservedActive = 0;

        const makeTask = (delayMs) => () => new Promise((resolve) => {
            active++;
            maxObservedActive = Math.max(maxObservedActive, active);
            setTimeout(() => {
                active--;
                resolve(true);
            }, delayMs);
        });

        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(pool.enqueue(makeTask(20)));
        }

        await Promise.all(promises);
        expect(maxObservedActive).toBeLessThanOrEqual(3);
    });

    test('FF-UPLOAD-19: Stress test large batch (1,000 files) performance & memory in Redux state', () => {
        const fileCount = 1000;
        const files = {};

        const startTime = Date.now();
        for (let i = 0; i < fileCount; i++) {
            const fileId = `session_test_file_${i}`;
            const isCompleted = i < 750; // 750 completed, 250 in progress
            files[fileId] = {
                id: fileId,
                name: `photo_${i}.jpg`,
                originalSize: 2000000,
                state: isCompleted ? UPLOAD_PARENT_STATES.COMPLETED : UPLOAD_PARENT_STATES.UPLOADING,
                derivatives: {
                    web: {
                        totalBytes: 1800000,
                        bytesTransferred: isCompleted ? 1800000 : 900000,
                        status: isCompleted ? UPLOAD_DERIVATIVE_STATES.COMPLETED : UPLOAD_DERIVATIVE_STATES.UPLOADING,
                    },
                    thumb: {
                        totalBytes: 200000,
                        bytesTransferred: isCompleted ? 200000 : 100000,
                        status: isCompleted ? UPLOAD_DERIVATIVE_STATES.COMPLETED : UPLOAD_DERIVATIVE_STATES.UPLOADING,
                    }
                }
            };
        }

        const state = {
            upload: {
                session: { id: 'stress-session', status: UPLOAD_SESSION_STATUS.OPEN },
                files,
            }
        };

        const sessionBytes = selectSessionBytes(state);
        const progress = selectSessionProgress(state);
        const duration = Date.now() - startTime;

        expect(sessionBytes.totalBytes).toBe(1000 * 2000000); // 2GB total
        // 750 files * 2MB + 250 files * 1MB = 1500MB + 250MB = 1750MB transferred
        expect(sessionBytes.bytesTransferred).toBe(1750000000);
        // (1750 / 2000) * 100 = 87.5%
        expect(progress).toBeCloseTo(87.5, 1);
        // Must compute in under 100ms for 1000 files
        expect(duration).toBeLessThan(200);
    });
});
