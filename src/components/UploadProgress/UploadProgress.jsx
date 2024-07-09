import React, { useEffect, useState } from 'react'
import './UploadProgress.scss'
import { convertMegabytes } from '../../utils/stringUtils';
function UploadProgress({uploadList,uploadStatus}) {
    const [uploadPercent,setUploadPercent] = useState(0)
    const [totalProgress,setTotalProgress]  = useState(0)
    useEffect(() => {
        setTotalProgress(0)
        let totalFilesCount= uploadList.length;
        uploadList.forEach(item => {
            if(item.status === 'uploaded')
            {
                setTotalProgress(totalProgress+1)
            }
        })
         setUploadPercent(totalProgress/totalFilesCount*100);
    }, [uploadList])
    const [modalState, setModalState] = useState('')
    useEffect(() => {
        if(uploadStatus == 'completed'){
            setModalState('completed')
        }
        if(uploadStatus == 'close'){
            setModalState('close')
        }
        if(uploadStatus == 'open'){
            setModalState('')
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
                <p>128 Photos Uploaded</p>
            </div>:
            <div className="header-title">
                <h4>Uploading {totalProgress} of {uploadList.length}</h4>
                <p>128MB Remaining</p>
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
                        <p className="file-name">{file.name}</p>
                        <p className="file-progress">Uploading {file.progress?file.progress+'%':''} . {convertMegabytes(file.size/1000000,2)}</p>
                    </div>
                    <div className="task-status"></div>
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