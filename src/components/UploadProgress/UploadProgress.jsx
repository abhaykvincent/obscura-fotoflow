import React, { useEffect, useRef, useState, useMemo } from 'react';
import './UploadProgress.scss';
import { capitalizeFirstLetter, convertMegabytes, shortenFileName } from '../../utils/stringUtils';
import { useSelector } from 'react-redux';
import {
    selectUploadStatus,
    selectUploadFilesArray,
    selectSessionProgress,
    selectTotalFilesCount,
    selectCompletedFilesCount,
    calculateFileProgress,
    UPLOAD_PARENT_STATES,
    UPLOAD_SESSION_STATUS,
} from '../../app/slices/uploadSlice';

function UploadProgress() {
    const uploadStatus = useSelector(selectUploadStatus);
    const files = useSelector(selectUploadFilesArray);
    const sessionProgress = useSelector(selectSessionProgress);
    const totalFilesCount = useSelector(selectTotalFilesCount);
    const completedFilesCount = useSelector(selectCompletedFilesCount);

    const [modalState, setModalState] = useState('close');
    const [removingFileIds, setRemovingFileIds] = useState(new Set());
    const [removedFileIds, setRemovedFileIds] = useState(new Set());
    const removalTimersRef = useRef({});

    // Filter visible files based on presentation-level removal animation
    const visibleFiles = useMemo(() =>
        files.filter((file) => !removedFileIds.has(file.id)),
    [files, removedFileIds]);

    // Manage presentation timers for completed files
    useEffect(() => {
        const activeFileIds = new Set(files.map((file) => file.id));

        Object.entries(removalTimersRef.current).forEach(([fileId, timers]) => {
            if (!activeFileIds.has(fileId)) {
                timers.forEach(clearTimeout);
                delete removalTimersRef.current[fileId];
            }
        });

        setRemovedFileIds((currentIds) => {
            const nextIds = new Set([...currentIds].filter((fileId) => activeFileIds.has(fileId)));
            return nextIds.size === currentIds.size ? currentIds : nextIds;
        });

        setRemovingFileIds((currentIds) => {
            const nextIds = new Set([...currentIds].filter((fileId) => activeFileIds.has(fileId)));
            return nextIds.size === currentIds.size ? currentIds : nextIds;
        });
    }, [files]);

    useEffect(() => {
        files.forEach((file) => {
            const isCompleted = file.state === UPLOAD_PARENT_STATES.COMPLETED || file.status === 'uploaded';
            if (!isCompleted || removalTimersRef.current[file.id]) return;

            const startRemovalTimer = setTimeout(() => {
                setRemovingFileIds((currentIds) => new Set(currentIds).add(file.id));
            }, 700);

            const completeRemovalTimer = setTimeout(() => {
                setRemovedFileIds((currentIds) => new Set(currentIds).add(file.id));
                delete removalTimersRef.current[file.id];
            }, 1300);

            removalTimersRef.current[file.id] = [startRemovalTimer, completeRemovalTimer];
        });
    }, [files]);

    useEffect(() => () => {
        Object.values(removalTimersRef.current).forEach((timers) => {
            timers.forEach(clearTimeout);
        });
    }, []);

    // Handle modal display transitions and auto-minimize
    useEffect(() => {
        let timer;
        let completedTimer;

        if (uploadStatus === UPLOAD_SESSION_STATUS.COMPLETED || uploadStatus === 'completed') {
            completedTimer = setTimeout(() => {
                setModalState('completed');
            }, visibleFiles.length > 0 ? 1500 : 0);
        } else if (uploadStatus === UPLOAD_SESSION_STATUS.CLOSE || uploadStatus === 'close') {
            setModalState('close');
        } else if (uploadStatus === UPLOAD_SESSION_STATUS.OPEN || uploadStatus === 'open') {
            setModalState('');
            timer = setTimeout(() => {
                setModalState('minimize');
            }, 60000);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (completedTimer) clearTimeout(completedTimer);
        };
    }, [uploadStatus, visibleFiles.length]);

    const onMinimize = () => setModalState('minimize');
    const onMaximize = () => setModalState('maximize');
    const onClose = () => setModalState('close');

    if (modalState === 'close' && (uploadStatus === UPLOAD_SESSION_STATUS.CLOSE || uploadStatus === 'close')) {
        return null;
    }

    const isSessionCompleted = uploadStatus === UPLOAD_SESSION_STATUS.COMPLETED || uploadStatus === 'completed';

    return (
        <div className={`upload-progress ${modalState}`}>
            <div className="header">
                <div className={`header-process ${isSessionCompleted ? 'uploadCompleted' : 'active'}`}></div>

                <div className="header-title">
                    {isSessionCompleted ? (
                        <>
                            <h4>Uploading Completed</h4>
                            <p>Uploaded all {totalFilesCount} photos</p>
                        </>
                    ) : (
                        <>
                            <h4>Uploading {completedFilesCount} of {totalFilesCount}</h4>
                        </>
                    )}
                </div>

                <div className="modal-controls">
                    <div className="control maximize" onClick={onMaximize}></div>
                    <div className="control minimize" onClick={onMinimize}></div>
                    <div className="control close" onClick={onClose}></div>
                </div>

                <div className="total-progress">
                    <div
                        className="progress-bar"
                        style={{ width: `${Math.round(sessionProgress)}%` }}
                    ></div>
                </div>
            </div>

            <div className="body">
                <div className="upload-queue">
                    {visibleFiles.map((file) => {
                        const fileProgress = calculateFileProgress(file);
                        const state = file.state || file.status || UPLOAD_PARENT_STATES.PENDING;
                        const isDone = state === UPLOAD_PARENT_STATES.COMPLETED || state === 'uploaded';
                        const isRemoving = removingFileIds.has(file.id);
                        const fileSize = file.originalSize || file.size || 0;

                        return (
                            <div className={`upload-task ${state} ${isRemoving ? 'removing' : ''}`} key={file.id}>
                                <div className="task-cover"></div>
                                <div className="task-name">
                                    <p className="file-name">{shortenFileName(file.name)}</p>
                                    <p className="file-progress-percentage">
                                        {convertMegabytes(fileSize / 1000000, 2)}
                                        <span className="file-progress-state">
                                            {state === UPLOAD_PARENT_STATES.PROCESSING && file.processing?.step
                                                ? `Processing (${file.processing.step})`
                                                : capitalizeFirstLetter(state)}
                                        </span>
                                    </p>
                                </div>
                                <div className={`task-status ${isDone ? 'done' : ''}`}></div>
                                <div className="file-progress">
                                    <div
                                        className={`file-progress-bar ${isDone ? 'done' : ''}`}
                                        style={{ width: `${fileProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default UploadProgress;
