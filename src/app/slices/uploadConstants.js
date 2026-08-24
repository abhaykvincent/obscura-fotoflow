/**
 * Canonical Upload State Machine Contract & Constants
 * 
 * Defines all valid states, derivative definitions, processing stages,
 * and state transition rules for FotoFlow's upload pipeline.
 */

export const UPLOAD_PARENT_STATES = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    UPLOADING: 'uploading',
    VERIFYING: 'verifying',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
});

export const UPLOAD_DERIVATIVE_STATES = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    UPLOADING: 'uploading',
    VERIFYING: 'verifying',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
});

export const UPLOAD_SESSION_STATUS = Object.freeze({
    IDLE: 'idle',
    OPEN: 'open',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    CLOSE: 'close',
});

export const PROCESSING_STEPS = Object.freeze({
    IDLE: 'idle',
    EXIF: 'exif',
    DIMENSIONS: 'dimensions',
    COMPRESSION: 'compression',
    DONE: 'done',
});

export const REQUIRED_DERIVATIVES = Object.freeze(['web', 'thumb']);

/**
 * Valid state transitions for parent file state machine
 */
export const VALID_PARENT_TRANSITIONS = Object.freeze({
    [UPLOAD_PARENT_STATES.PENDING]: [
        UPLOAD_PARENT_STATES.PROCESSING,
        UPLOAD_PARENT_STATES.FAILED,
        UPLOAD_PARENT_STATES.CANCELLED
    ],
    [UPLOAD_PARENT_STATES.PROCESSING]: [
        UPLOAD_PARENT_STATES.UPLOADING,
        UPLOAD_PARENT_STATES.FAILED,
        UPLOAD_PARENT_STATES.CANCELLED
    ],
    [UPLOAD_PARENT_STATES.UPLOADING]: [
        UPLOAD_PARENT_STATES.VERIFYING,
        UPLOAD_PARENT_STATES.FAILED,
        UPLOAD_PARENT_STATES.CANCELLED
    ],
    [UPLOAD_PARENT_STATES.VERIFYING]: [
        UPLOAD_PARENT_STATES.COMPLETED,
        UPLOAD_PARENT_STATES.FAILED,
        UPLOAD_PARENT_STATES.CANCELLED
    ],
    [UPLOAD_PARENT_STATES.FAILED]: [
        UPLOAD_PARENT_STATES.PENDING,
        UPLOAD_PARENT_STATES.PROCESSING,
        UPLOAD_PARENT_STATES.UPLOADING
    ],
    [UPLOAD_PARENT_STATES.CANCELLED]: [
        UPLOAD_PARENT_STATES.PENDING
    ],
    [UPLOAD_PARENT_STATES.COMPLETED]: []
});

/**
 * Valid state transitions for derivative state machine
 */
export const VALID_DERIVATIVE_TRANSITIONS = Object.freeze({
    [UPLOAD_DERIVATIVE_STATES.PENDING]: [
        UPLOAD_DERIVATIVE_STATES.PROCESSING,
        UPLOAD_DERIVATIVE_STATES.UPLOADING,
        UPLOAD_DERIVATIVE_STATES.FAILED,
        UPLOAD_DERIVATIVE_STATES.CANCELLED
    ],
    [UPLOAD_DERIVATIVE_STATES.PROCESSING]: [
        UPLOAD_DERIVATIVE_STATES.UPLOADING,
        UPLOAD_DERIVATIVE_STATES.FAILED,
        UPLOAD_DERIVATIVE_STATES.CANCELLED
    ],
    [UPLOAD_DERIVATIVE_STATES.UPLOADING]: [
        UPLOAD_DERIVATIVE_STATES.VERIFYING,
        UPLOAD_DERIVATIVE_STATES.COMPLETED,
        UPLOAD_DERIVATIVE_STATES.FAILED,
        UPLOAD_DERIVATIVE_STATES.CANCELLED
    ],
    [UPLOAD_DERIVATIVE_STATES.VERIFYING]: [
        UPLOAD_DERIVATIVE_STATES.COMPLETED,
        UPLOAD_DERIVATIVE_STATES.FAILED,
        UPLOAD_DERIVATIVE_STATES.CANCELLED
    ],
    [UPLOAD_DERIVATIVE_STATES.FAILED]: [
        UPLOAD_DERIVATIVE_STATES.PENDING,
        UPLOAD_DERIVATIVE_STATES.PROCESSING,
        UPLOAD_DERIVATIVE_STATES.UPLOADING
    ],
    [UPLOAD_DERIVATIVE_STATES.CANCELLED]: [
        UPLOAD_DERIVATIVE_STATES.PENDING
    ],
    [UPLOAD_DERIVATIVE_STATES.COMPLETED]: []
});

/**
 * Helper to validate state transitions
 */
export const isValidParentTransition = (fromState, toState) => {
    if (fromState === toState) return true;
    const allowed = VALID_PARENT_TRANSITIONS[fromState];
    return allowed ? allowed.includes(toState) : false;
};

export const isValidDerivativeTransition = (fromState, toState) => {
    if (fromState === toState) return true;
    const allowed = VALID_DERIVATIVE_TRANSITIONS[fromState];
    return allowed ? allowed.includes(toState) : false;
};
