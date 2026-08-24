import { createSlice } from '@reduxjs/toolkit';
import {
    UPLOAD_PARENT_STATES,
    UPLOAD_DERIVATIVE_STATES,
    UPLOAD_SESSION_STATUS,
    PROCESSING_STEPS,
    REQUIRED_DERIVATIVES,
    isValidParentTransition,
    isValidDerivativeTransition,
} from './uploadConstants';

const initialState = {
    session: {
        id: null,
        status: UPLOAD_SESSION_STATUS.CLOSE,
        startedAt: null,
        completedAt: null,
        error: null,
    },
    files: {},
    // Legacy support fields:
    uploadStatus: UPLOAD_SESSION_STATUS.CLOSE,
    uploadList: {},
};

const createInitialDerivative = () => ({
    status: UPLOAD_DERIVATIVE_STATES.PENDING,
    bytesTransferred: 0,
    totalBytes: 0,
    url: null,
    error: null,
});

const createInitialFile = (fileData) => {
    const fileId = fileData.id;
    return {
        id: fileId,
        name: fileData.name,
        originalSize: fileData.originalSize || fileData.size || 0,
        size: fileData.size || fileData.originalSize || 0,
        state: UPLOAD_PARENT_STATES.PENDING,
        processing: {
            step: PROCESSING_STEPS.IDLE,
            progress: 0,
        },
        derivatives: {
            web: createInitialDerivative(),
            thumb: createInitialDerivative(),
        },
        metadata: {
            dateTimeOriginal: fileData.dateTimeOriginal || null,
            dimensions: fileData.dimensions || { width: 0, height: 0 },
        },
        urls: {
            web: null,
            thumb: null,
        },
        error: null,
    };
};

const uploadSlice = createSlice({
    name: 'upload',
    initialState,
    reducers: {
        setUploadStatus: (state, action) => {
            const status = action.payload;
            state.session.status = status;
            state.uploadStatus = status;
            if (status === UPLOAD_SESSION_STATUS.COMPLETED || status === 'completed') {
                state.session.completedAt = Date.now();
            }
        },

        startUploadSession: (state, action) => {
            const payload = action.payload;
            const sessionId = payload?.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const rawFiles = Array.isArray(payload) ? payload : (payload?.files || []);

            state.session = {
                id: sessionId,
                status: UPLOAD_SESSION_STATUS.OPEN,
                startedAt: Date.now(),
                completedAt: null,
                error: null,
            };
            state.uploadStatus = UPLOAD_SESSION_STATUS.OPEN;
            state.files = {};
            state.uploadList = {};

            rawFiles.forEach((file, index) => {
                const fileId = file.id || `${sessionId}-file-${index}`;
                const fileEntity = createInitialFile({ ...file, id: fileId });
                state.files[fileId] = fileEntity;
            });
        },

        setFileProcessing: (state, action) => {
            const { fileId, step, progress } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (isValidParentTransition(file.state, UPLOAD_PARENT_STATES.PROCESSING)) {
                file.state = UPLOAD_PARENT_STATES.PROCESSING;
            }
            file.processing = {
                step: step || file.processing?.step || PROCESSING_STEPS.IDLE,
                progress: typeof progress === 'number' ? progress : (file.processing?.progress || 0),
            };
        },

        setFileMetadata: (state, action) => {
            const { fileId, metadata } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            file.metadata = {
                ...file.metadata,
                ...metadata,
            };
        },

        initFileDerivatives: (state, action) => {
            const { fileId, derivatives } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (isValidParentTransition(file.state, UPLOAD_PARENT_STATES.UPLOADING)) {
                file.state = UPLOAD_PARENT_STATES.UPLOADING;
            }

            Object.entries(derivatives).forEach(([type, info]) => {
                if (!file.derivatives[type]) {
                    file.derivatives[type] = createInitialDerivative();
                }
                file.derivatives[type].totalBytes = info.totalBytes || info.size || file.derivatives[type].totalBytes;
                file.derivatives[type].status = info.status || UPLOAD_DERIVATIVE_STATES.PENDING;
            });
        },

        updateDerivativeProgress: (state, action) => {
            const { fileId, derivativeType, bytesTransferred, totalBytes, status } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (!file.derivatives[derivativeType]) {
                file.derivatives[derivativeType] = createInitialDerivative();
            }

            const deriv = file.derivatives[derivativeType];

            if (typeof bytesTransferred === 'number') {
                deriv.bytesTransferred = bytesTransferred;
            }
            if (typeof totalBytes === 'number' && totalBytes > 0) {
                deriv.totalBytes = totalBytes;
            }
            if (status && isValidDerivativeTransition(deriv.status, status)) {
                deriv.status = status;
            }

            // If file is pending or processing, shift to uploading once bytes are moving or derivative is uploading
            if (file.state === UPLOAD_PARENT_STATES.PENDING || file.state === UPLOAD_PARENT_STATES.PROCESSING) {
                if (deriv.status === UPLOAD_DERIVATIVE_STATES.UPLOADING || deriv.bytesTransferred > 0) {
                    file.state = UPLOAD_PARENT_STATES.UPLOADING;
                }
            }
        },

        setDerivativeVerified: (state, action) => {
            const { fileId, derivativeType, url } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (!file.derivatives[derivativeType]) {
                file.derivatives[derivativeType] = createInitialDerivative();
            }

            const deriv = file.derivatives[derivativeType];
            deriv.status = UPLOAD_DERIVATIVE_STATES.COMPLETED;
            deriv.url = url;
            if (deriv.totalBytes > 0) {
                deriv.bytesTransferred = deriv.totalBytes;
            }

            if (!file.urls) file.urls = {};
            file.urls[derivativeType] = url;
            if (derivativeType === 'web') file.url = url;
            if (derivativeType === 'thumb') file.thumbUrl = url;
        },

        setFileVerifying: (state, action) => {
            const { fileId } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (isValidParentTransition(file.state, UPLOAD_PARENT_STATES.VERIFYING)) {
                file.state = UPLOAD_PARENT_STATES.VERIFYING;
            }
        },

        setFileCompleted: (state, action) => {
            const { fileId, urls } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            // Deterministic validation: verify all required derivatives are completed
            const allDerivativesComplete = REQUIRED_DERIVATIVES.every(
                (d) => file.derivatives[d]?.status === UPLOAD_DERIVATIVE_STATES.COMPLETED ||
                       file.derivatives[d]?.status === 'uploaded' ||
                       Boolean(urls && urls[d]) ||
                       Boolean(file.urls && file.urls[d])
            );

            if (!allDerivativesComplete) {
                console.warn(`Cannot mark file ${fileId} completed: not all required derivatives are complete`);
                return;
            }

            file.state = UPLOAD_PARENT_STATES.COMPLETED;
            file.status = 'uploaded'; // legacy compatibility
            file.error = null;

            if (urls) {
                file.urls = { ...file.urls, ...urls };
                if (urls.web) file.url = urls.web;
                if (urls.thumb) file.thumbUrl = urls.thumb;
            }

            REQUIRED_DERIVATIVES.forEach((d) => {
                if (file.derivatives[d]) {
                    file.derivatives[d].status = UPLOAD_DERIVATIVE_STATES.COMPLETED;
                    if (file.derivatives[d].totalBytes > 0) {
                        file.derivatives[d].bytesTransferred = file.derivatives[d].totalBytes;
                    }
                }
            });
        },

        setFileFailed: (state, action) => {
            const { fileId, error, derivativeType } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (derivativeType && file.derivatives[derivativeType]) {
                file.derivatives[derivativeType].status = UPLOAD_DERIVATIVE_STATES.FAILED;
                file.derivatives[derivativeType].error = error;
            }

            file.state = UPLOAD_PARENT_STATES.FAILED;
            file.status = 'failed'; // legacy compatibility
            file.error = error || 'Upload failed';
        },

        retryDerivative: (state, action) => {
            const { fileId, derivativeType } = action.payload;
            const file = state.files[fileId];
            if (!file) return;

            if (derivativeType && file.derivatives[derivativeType]) {
                file.derivatives[derivativeType].status = UPLOAD_DERIVATIVE_STATES.PENDING;
                file.derivatives[derivativeType].bytesTransferred = 0;
                file.derivatives[derivativeType].error = null;
            }

            file.error = null;
            file.state = UPLOAD_PARENT_STATES.UPLOADING;
            file.status = 'uploading';
        },

        removeUploadFile: (state, action) => {
            const { fileId } = action.payload;
            delete state.files[fileId];
            delete state.uploadList[fileId];
        },

        clearUploadSession: (state) => {
            state.session = {
                id: null,
                status: UPLOAD_SESSION_STATUS.CLOSE,
                startedAt: null,
                completedAt: null,
                error: null,
            };
            state.files = {};
            state.uploadStatus = UPLOAD_SESSION_STATUS.CLOSE;
            state.uploadList = {};
        },

        // Backward compatibility reducer for legacy calls to updateUploadFile
        updateUploadFile: (state, action) => {
            const { fileId, changes } = action.payload;
            let file = state.files[fileId];
            if (!file) return;

            if (changes.status) {
                const mappedStatus = changes.status === 'uploaded' ? UPLOAD_PARENT_STATES.COMPLETED : changes.status;
                file.state = mappedStatus;
                file.status = changes.status;
            }

            if (changes.uploadParts || changes.derivatives) {
                const parts = changes.uploadParts || changes.derivatives;
                Object.entries(parts).forEach(([partKey, partData]) => {
                    if (!file.derivatives[partKey]) {
                        file.derivatives[partKey] = createInitialDerivative();
                    }
                    const deriv = file.derivatives[partKey];
                    if (partData.status) deriv.status = partData.status === 'uploaded' ? UPLOAD_DERIVATIVE_STATES.COMPLETED : partData.status;
                    if (typeof partData.bytesTransferred === 'number') deriv.bytesTransferred = partData.bytesTransferred;
                    if (typeof partData.totalBytes === 'number') deriv.totalBytes = partData.totalBytes;
                });
            }

            if (changes.url) {
                file.urls.web = changes.url;
                file.url = changes.url;
            }
            if (changes.thumbUrl) {
                file.urls.thumb = changes.thumbUrl;
                file.thumbUrl = changes.thumbUrl;
            }
            if (changes.error) {
                file.error = changes.error;
            }
        },
    },
});

export const {
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
    updateUploadFile,
    removeUploadFile,
    clearUploadSession,
} = uploadSlice.actions;

export * from './uploadConstants';
export * from './uploadSelectors';

export default uploadSlice.reducer;
