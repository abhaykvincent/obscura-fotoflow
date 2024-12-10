import React, { useEffect, useState } from 'react'
import './UploadProgress.scss'
import { capitalizeFirstLetter, convertMegabytes, shortenFileName } from '../../utils/stringUtils';
import { useSelector } from 'react-redux';
import { selectUploadList, selectUploadStatus, setUploadList } from '../../app/slices/uploadSlice';
import { set } from 'date-fns';

function UploadProgress({}) {
    const uploadList = useSelector(selectUploadList)
    const uploadStatus = useSelector(selectUploadStatus)
    const [uploadPercent,setUploadPercent] = useState(0)
    const [totalProgress,setTotalProgress]  = useState(0)
    const [modalState, setModalState] = useState('close')
    const [uploadingCompleted,setUploadingCompleted] = useState(false)


    useEffect(() => {
        console.log(uploadingCompleted)
    }, [uploadingCompleted])
    useEffect(() => {
        let totalFilesCount= uploadList.length;
        console.log(uploadList)
        let totalProgressBatch = 0;
        uploadList.forEach((item,i) => {
            if(item.status === 'uploaded' || i === 0)
            {
                totalProgressBatch += 1;
            }
        })
        console.log(totalProgressBatch)
        console.log(totalFilesCount)
        console.log(totalProgressBatch/totalFilesCount*100)

        setUploadPercent(totalProgressBatch/totalFilesCount*100);
        setTotalProgress(totalProgressBatch)
    }, [uploadList])

    useEffect(() => {
        if(uploadStatus == 'completed'){
                setModalState('completed')
                setUploadingCompleted(true)
        
        }
        if(uploadStatus == 'close'){
            setTimeout(() => {
                setModalState('close')
                setUploadingCompleted(false)
                setUploadPercent(0)
                setTotalProgress(0)
                setUploadList([])
                setModalState('close')
            },5000)
        }
        if(uploadStatus == 'open'){
            setModalState('')
            setTimeout(() => {
                if(uploadStatus !=='completed')
                setModalState('minimize')
            },8000)
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
        <div className={`header-process ${uploadingCompleted ? 'uploadCompleted' : ''}`}>

        </div>
        {
            uploadingCompleted ?
            <div className="header-title">
                <h4>Uploading Completed</h4>
                <p>{uploadList.length} Photos Uploaded</p>
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
                style={{width:uploadPercent+'%'}}
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
                            <p className="file-progress-percentage"> {convertMegabytes(file.size/1000000,2)} 
                                <span>{
                                    capitalizeFirstLetter(file.status)
                                }</span>
                            </p>
                        </div>
                        <div className={`task-status ${file.progress===100 && 'done' }`}></div>
                        <div className="file-progress">
                            <div className={`file-progress-bar ${file.status==='uploaded' ? 'done': '' }`}
                                style={{width: file.progress+'%' }}
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