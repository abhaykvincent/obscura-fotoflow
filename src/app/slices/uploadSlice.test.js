import uploadReducer, {
    setUploadStatus,
    startUploadSession,
    setFileProcessing,
    setFileMetadata,
    initFileDerivatives,
    updateDerivativeProgress,
    setDerivativeVerified,
    setFileVerifying,
    setFileCompleted,
    setFileFailed,
    retryDerivative,
    removeUploadFile,
    clearUploadSession,
    UPLOAD_PARENT_STATES,
    UPLOAD_DERIVATIVE_STATES,
    UPLOAD_SESSION_STATUS,
    PROCESSING_STEPS,
} from './uploadSlice';

describe('Upload State Machine & Reducer (FF-UPLOAD-16)', () => {
    let initialState;

    beforeEach(() => {
        initialState = uploadReducer(undefined, { type: '@@INIT' });
    });

    test('should initialize with default closed session state', () => {
        expect(initialState.session.status).toBe(UPLOAD_SESSION_STATUS.CLOSE);
        expect(initialState.files).toEqual({});
    });

    test('startUploadSession initializes files in pending state', () => {
        const filesPayload = [
            { id: 'file-1', name: 'photo1.jpg', size: 2000000 },
            { id: 'file-2', name: 'photo2.png', size: 4000000 },
        ];

        const state = uploadReducer(initialState, startUploadSession({ sessionId: 'session-123', files: filesPayload }));

        expect(state.session.id).toBe('session-123');
        expect(state.session.status).toBe(UPLOAD_SESSION_STATUS.OPEN);
        expect(Object.keys(state.files).length).toBe(2);
        expect(state.files['file-1'].state).toBe(UPLOAD_PARENT_STATES.PENDING);
        expect(state.files['file-1'].derivatives.web.status).toBe(UPLOAD_DERIVATIVE_STATES.PENDING);
        expect(state.files['file-1'].derivatives.thumb.status).toBe(UPLOAD_DERIVATIVE_STATES.PENDING);
    });

    test('transitions: pending -> processing -> uploading -> verifying -> completed', () => {
        let state = uploadReducer(
            initialState,
            startUploadSession({ sessionId: 's1', files: [{ id: 'f1', name: 'test.jpg', size: 1000 }] })
        );

        // Processing (EXIF / dimensions / compression)
        state = uploadReducer(state, setFileProcessing({ fileId: 'f1', step: PROCESSING_STEPS.EXIF, progress: 25 }));
        expect(state.files['f1'].state).toBe(UPLOAD_PARENT_STATES.PROCESSING);
        expect(state.files['f1'].processing.step).toBe(PROCESSING_STEPS.EXIF);

        // Init derivatives & Uploading
        state = uploadReducer(state, initFileDerivatives({
            fileId: 'f1',
            derivatives: {
                web: { totalBytes: 800, status: UPLOAD_DERIVATIVE_STATES.PENDING },
                thumb: { totalBytes: 200, status: UPLOAD_DERIVATIVE_STATES.PENDING },
            }
        }));
        expect(state.files['f1'].state).toBe(UPLOAD_PARENT_STATES.UPLOADING);

        // Derivative Progress
        state = uploadReducer(state, updateDerivativeProgress({
            fileId: 'f1',
            derivativeType: 'web',
            bytesTransferred: 400,
            totalBytes: 800,
            status: UPLOAD_DERIVATIVE_STATES.UPLOADING,
        }));
        expect(state.files['f1'].derivatives.web.bytesTransferred).toBe(400);

        // Complete derivatives
        state = uploadReducer(state, setDerivativeVerified({ fileId: 'f1', derivativeType: 'web', url: 'https://cdn.com/web.jpg' }));
        state = uploadReducer(state, setDerivativeVerified({ fileId: 'f1', derivativeType: 'thumb', url: 'https://cdn.com/thumb.jpg' }));

        expect(state.files['f1'].derivatives.web.status).toBe(UPLOAD_DERIVATIVE_STATES.COMPLETED);
        expect(state.files['f1'].derivatives.thumb.status).toBe(UPLOAD_DERIVATIVE_STATES.COMPLETED);

        // Verifying
        state = uploadReducer(state, setFileVerifying({ fileId: 'f1' }));
        expect(state.files['f1'].state).toBe(UPLOAD_PARENT_STATES.VERIFYING);

        // Completed
        state = uploadReducer(state, setFileCompleted({
            fileId: 'f1',
            urls: { web: 'https://cdn.com/web.jpg', thumb: 'https://cdn.com/thumb.jpg' }
        }));
        expect(state.files['f1'].state).toBe(UPLOAD_PARENT_STATES.COMPLETED);
        expect(state.files['f1'].urls.web).toBe('https://cdn.com/web.jpg');
    });

    test('deterministic file completion: cannot mark file completed if derivative is incomplete', () => {
        let state = uploadReducer(
            initialState,
            startUploadSession({ sessionId: 's1', files: [{ id: 'f1', name: 'test.jpg', size: 1000 }] })
        );

        // Only web is completed, thumb is missing
        state = uploadReducer(state, setDerivativeVerified({ fileId: 'f1', derivativeType: 'web', url: 'https://cdn.com/web.jpg' }));
        state = uploadReducer(state, setFileCompleted({
            fileId: 'f1',
            urls: { web: 'https://cdn.com/web.jpg' } // thumb is not provided
        }));

        // State must NOT transition to COMPLETED because thumb is incomplete
        expect(state.files['f1'].state).not.toBe(UPLOAD_PARENT_STATES.COMPLETED);
    });

    test('partial derivative failure and independent retry (FF-UPLOAD-14)', () => {
        let state = uploadReducer(
            initialState,
            startUploadSession({ sessionId: 's1', files: [{ id: 'f1', name: 'test.jpg', size: 1000 }] })
        );

        // Web succeeded
        state = uploadReducer(state, setDerivativeVerified({ fileId: 'f1', derivativeType: 'web', url: 'https://cdn.com/web.jpg' }));

        // Thumb failed
        state = uploadReducer(state, setFileFailed({ fileId: 'f1', error: 'Network error on thumb', derivativeType: 'thumb' }));

        expect(state.files['f1'].state).toBe(UPLOAD_PARENT_STATES.FAILED);
        expect(state.files['f1'].derivatives.web.status).toBe(UPLOAD_DERIVATIVE_STATES.COMPLETED);
        expect(state.files['f1'].derivatives.thumb.status).toBe(UPLOAD_DERIVATIVE_STATES.FAILED);

        // Retry only thumb derivative
        state = uploadReducer(state, retryDerivative({ fileId: 'f1', derivativeType: 'thumb' }));

        // Web derivative must remain completed!
        expect(state.files['f1'].derivatives.web.status).toBe(UPLOAD_DERIVATIVE_STATES.COMPLETED);
        expect(state.files['f1'].derivatives.web.url).toBe('https://cdn.com/web.jpg');
        // Thumb reset to pending
        expect(state.files['f1'].derivatives.thumb.status).toBe(UPLOAD_DERIVATIVE_STATES.PENDING);
        expect(state.files['f1'].state).toBe(UPLOAD_PARENT_STATES.UPLOADING);
    });

    test('handles multiple duplicate named files safely with unique IDs', () => {
        const state = uploadReducer(
            initialState,
            startUploadSession({
                sessionId: 's1',
                files: [
                    { id: 'uuid-1', name: 'IMG_0001.jpg', size: 5000 },
                    { id: 'uuid-2', name: 'IMG_0001.jpg', size: 5000 },
                ]
            })
        );

        expect(Object.keys(state.files).length).toBe(2);
        expect(state.files['uuid-1'].name).toBe('IMG_0001.jpg');
        expect(state.files['uuid-2'].name).toBe('IMG_0001.jpg');
    });

    test('removeUploadFile and clearUploadSession work correctly', () => {
        let state = uploadReducer(
            initialState,
            startUploadSession({
                sessionId: 's1',
                files: [
                    { id: 'f1', name: '1.jpg', size: 100 },
                    { id: 'f2', name: '2.jpg', size: 200 }
                ]
            })
        );

        state = uploadReducer(state, removeUploadFile({ fileId: 'f1' }));
        expect(state.files['f1']).toBeUndefined();
        expect(state.files['f2']).toBeDefined();

        state = uploadReducer(state, clearUploadSession());
        expect(state.files).toEqual({});
        expect(state.session.status).toBe(UPLOAD_SESSION_STATUS.CLOSE);
    });
});
