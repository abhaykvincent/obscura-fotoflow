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
        let totalProgressCount=0

        let totalFilesCount= uploadList.length;
        uploadList.forEach((item,i) => {
            if(item.status === 'uploaded' )
            {
                totalProgressCount=totalProgressCount+1
            }
        })
        setTotalProgress(totalProgressCount)
    }, [uploadList])

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
            }, 1000)
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
                <p> Uploaded all {uploadList.length} photos</p>
            </div>:
            <div className="header-title">
                <h4>Uploading {totalProgress} of {uploadList.length}</h4>
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
                style={{width:totalProgress/uploadList.length*100+'%'}}
            ></div>
        </div>
        </div>
        <div className="body">
            <div className="upload-queue">
                {
                uploadList.map((file, index) => (
                    <div className={`upload-task ${file.status}`} key={index}>
                        <div className="task-cover"></div>
                        <div className="task-name">
                            <p className="file-name">{ shortenFileName(file.name)}</p>
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