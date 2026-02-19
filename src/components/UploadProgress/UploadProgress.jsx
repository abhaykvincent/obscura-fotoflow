import React, { useEffect, useState, useMemo } from 'react';
import './UploadProgress.scss';
import { capitalizeFirstLetter, convertMegabytes, shortenFileName } from '../../utils/stringUtils';
import { useSelector } from 'react-redux';
import { selectUploadList, selectUploadStatus } from '../../app/slices/uploadSlice';

function UploadProgress() {
    const uploadList = useSelector(selectUploadList);
    const uploadStatus = useSelector(selectUploadStatus);
    const [modalState, setModalState] = useState('close');

    // Derived data using useMemo for efficiency
    const files = useMemo(() => Object.values(uploadList), [uploadList]);
    const totalFilesCount = files.length;
    
    const totalProgressCount = useMemo(() => 
        files.filter((item) => item.status === 'uploaded').length, 
    [files]);

    const uploadPercent = useMemo(() => 
        totalFilesCount > 0 ? (totalProgressCount / totalFilesCount) * 100 : 0
    , [totalProgressCount, totalFilesCount]);

    // Handle modal state transitions and auto-minimize timer
    useEffect(() => {
        let timer;
        
        if (uploadStatus === 'completed') {
            setModalState('completed');
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
        };
    }, [uploadStatus]);

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
                            <p>{uploadPercent.toFixed(0)}% completed</p>
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
                    {files.map((file) => (
                        <div className={`upload-task ${file.status}`} key={file.id}>
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
                            <div className={`task-status ${file.progress === 100 ? 'done' : ''}`}></div>
                            <div className="file-progress">
                                <div 
                                    className={`file-progress-bar ${file.progress === 100 ? 'done' : ''}`}
                                    style={{ width: file.status === 'uploading' ? `${file.progress || 2}%` : '100%' }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UploadProgress;
