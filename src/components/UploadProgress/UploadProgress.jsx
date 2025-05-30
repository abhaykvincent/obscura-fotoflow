import React, { useEffect, useState } from 'react'
import './UploadProgress.scss'
import { capitalizeFirstLetter, convertMegabytes, shortenFileName } from '../../utils/stringUtils';
import { useSelector } from 'react-redux';
import { selectUploadList, selectUploadStatus } from '../../app/slices/uploadSlice';

function UploadProgress({}) {
    const uploadList = useSelector(selectUploadList)
    const uploadStatus = useSelector(selectUploadStatus)
    const [uploadPercent,setUploadPercent] = useState(0)
    const [totalProgress,setTotalProgress]  = useState(0)
    const [modalState, setModalState] = useState('close')

    useEffect(() => {
        let totalProgressCount = 0;
        const files = Object.values(uploadList); // Get array of file objects
        const totalFilesCount = files.length;

        files.forEach((item) => {
            if (item.status === 'uploaded') {
                totalProgressCount++;
            }
        });

        setTotalProgress(totalProgressCount);
        // Calculate overall percentage for display, not directly used for uploadPercent state here
        if (totalFilesCount > 0) {
            setUploadPercent((totalProgressCount / totalFilesCount) * 100);
        } else {
            setUploadPercent(0);
        }
    }, [uploadList]);

    useEffect(() => {
        if(uploadStatus == 'completed'){
            setModalState('completed')
        }
        if(uploadStatus == 'close'){
            setModalState('close')
        }
        if(uploadStatus == 'open'){
            setModalState('')
            setTimeout(()=>{
                setModalState('minimize')
            }, 60000)
        }
    }, [uploadStatus])

    const onMinimize = () => {
        setModalState('minimize')
    }
    const onMaximize = () => {
        setModalState('maximize')
    }
    const onClose = () => {
        setModalState('close')
    }

  return (
    <div className={`upload-progress ${modalState}`}>
        <div className="header">
        <div className="header-process active">

        </div>
        {
            uploadStatus === 'completed' ?
            <div className="header-title">
                <h4>Uploading Completed</h4>
                <p> Uploaded all {Object.keys(uploadList).length} photos</p>
            </div>:
            <div className="header-title">
                <h4>Uploading {totalProgress} of {Object.keys(uploadList).length}</h4>
                <p></p>
            </div>
        }
        <div className="modal-controls">
            <div className="control maximize"
                onClick={onMaximize}
            ></div>
            <div className="control minimize"
                onClick={onMinimize}
            ></div>
            <div className="control close"
                onClick={onClose}
            ></div>
          </div>
        <div className="total-progress">
            <div className="progress-bar"
                style={{width: Object.keys(uploadList).length > 0 ? (totalProgress / Object.keys(uploadList).length * 100) + '%' : '0%'}}
            ></div>
        </div>
        </div>
        <div className="body">
            <div className="upload-queue">
                {
                Object.values(uploadList).map((file) => (
                    // Use file.id as the key, assuming file objects have a unique 'id' property
                    <div className={`upload-task ${file.status}`} key={file.id}> 
                        <div className="task-cover"></div>
                        <div className="task-name">
                            <p className="file-name">{shortenFileName(file.name)}</p>
                            <p className="file-progress-percentage"> 
                                {convertMegabytes(file.size/1000000,2)}
                                <span className="file-progress-state">
                                    {capitalizeFirstLetter(file.status)}
                                </span>
                            </p>
                        </div>
                        <div className={`task-status ${file.progress==100 && 'done' }`}></div>
                        <div className="file-progress">
                            <div className={`file-progress-bar `}
                            ></div>

                        </div>
                    </div>
                ))
                }
            </div>
        </div>
    </div>
  )
}

export default UploadProgress
// Line Complexity  1.0 ->