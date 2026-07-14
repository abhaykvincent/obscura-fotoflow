import React, { useEffect, useRef, useState, useMemo } from 'react';
import './UploadProgress.scss';
import { capitalizeFirstLetter, convertMegabytes, shortenFileName } from '../../utils/stringUtils';
import { useSelector } from 'react-redux';
import { selectUploadList, selectUploadStatus } from '../../app/slices/uploadSlice';

function UploadProgress() {
    const uploadList = useSelector(selectUploadList);
    const uploadStatus = useSelector(selectUploadStatus);
    const [modalState, setModalState] = useState('close');
    const [removingFileIds, setRemovingFileIds] = useState(new Set());
    const [removedFileIds, setRemovedFileIds] = useState(new Set());
    const removalTimersRef = useRef({});

    // Derived data using useMemo for efficiency
    const files = useMemo(() => Object.values(uploadList), [uploadList]);
    const totalFilesCount = files.length;
    
    const totalProgressCount = useMemo(() => 
        files.filter((item) => item.status === 'uploaded').length, 
    [files]);

    const uploadPercent = useMemo(() => 
        totalFilesCount > 0
            ? files.reduce((sum, file) => sum + (file.progress || 0), 0) / totalFilesCount
            : 0
    , [files, totalFilesCount]);

    const visibleFiles = useMemo(() =>
        files.filter((file) => !removedFileIds.has(file.id))
    , [files, removedFileIds]);

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
            if (file.status !== 'uploaded' || removalTimersRef.current[file.id]) return;

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

    // Handle modal state transitions and auto-minimize timer
    useEffect(() => {
        let timer;
        let completedTimer;
        
        if (uploadStatus === 'completed') {
            completedTimer = setTimeout(() => {
                setModalState('completed');
            }, visibleFiles.length > 0 ? 1500 : 0);
        } else if (uploadStatus === 'close') {
            setModalState('close');
        } else if (uploadStatus === 'open') {
            setModalState('');
            // Auto-minimize after 60 seconds of being open
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

    if (modalState === 'close' && uploadStatus === 'close') return null;

    return (
        <div className={`upload-progress ${modalState}`}>
            <div className="header">
                <div className={`header-process ${uploadStatus === 'completed' ? 'uploadCompleted' : 'active'}`}></div>
                
                <div className="header-title">
                    {uploadStatus === 'completed' ? (
                        <>
                            <h4>Uploading Completed</h4>
                            <p>Uploaded all {totalFilesCount} photos</p>
                        </>
                    ) : (
                        <>
                            <h4>Uploading {totalProgressCount} of {totalFilesCount}</h4>
                            {/* <p>{uploadPercent.toFixed(0)}% completed</p> */}
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
                        style={{ width: `${uploadPercent}%` }}
                    ></div>
                </div>
            </div>

            <div className="body">
                <div className="upload-queue">
                    {visibleFiles.map((file) => {
                        const fileProgress = Math.min(100, Math.max(0, file.progress || 0));
                        const visibleProgress = file.status === 'uploading' ? Math.max(fileProgress, 2) : fileProgress;
                        const isDone = file.status === 'uploaded' && fileProgress === 100;
                        const isRemoving = removingFileIds.has(file.id);

                        return (
                            <div className={`upload-task ${file.status} ${isRemoving ? 'removing' : ''}`} key={file.id}>
                                <div className="task-cover"></div>
                                <div className="task-name">
                                    <p className="file-name">{shortenFileName(file.name)}</p>
                                    <p className="file-progress-percentage">
                                        {convertMegabytes(file.size / 1000000, 2)}
                                        <span className="file-progress-state">
                                            {capitalizeFirstLetter(file.status)}
                                        </span>
                                    </p>
                                </div>
                                <div className={`task-status ${isDone ? 'done' : ''}`}></div>
                                <div className="file-progress">
                                    <div
                                        className={`file-progress-bar ${isDone ? 'done' : ''}`}
                                        style={{ width: `${visibleProgress}%` }}
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
