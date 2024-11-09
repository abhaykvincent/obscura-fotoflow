import React, { useState, useEffect } from 'react';
import './Alert.scss';
import { useDispatch, useSelector } from 'react-redux';
import { hideAlert, selectAlertId, selectAlertMessage, selectAlertShow, selectAlertType, } from '../../app/slices/alertSlice';
import { toast, Toaster } from 'sonner';
import { CheckCheck, CheckCheckIcon, FileWarningIcon, InfoIcon, MonitorPlayIcon } from 'lucide-react';

import { VscErrorSmall } from 'react-icons/vsc';
import { FaRunning } from 'react-icons/fa';

const Alert = () => {
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(true);
  const show = useSelector(selectAlertShow);
  const id = useSelector(selectAlertId);
  const type = useSelector(selectAlertType);
  const message = useSelector(selectAlertMessage);
  useEffect(() => {
    if (message !== '' && show && id) {
        toast(
            <div>
                <div dangerouslySetInnerHTML={{ __html: message }} />
            </div>,
            {
                id: id,
                className: type + ' alert',
                description: 'My description',
                duration: 8000,
                position: 'top-center',
                closeButton:true,
                icon: <MonitorPlayIcon />,
            }
        );
        setTimeout(() => {
            dispatch(hideAlert());
        }, 8000);
    }
}, [id]);
;

  /* onst alertClass = `alert ${type} ${visible ? 'show' : ''}`; */

  return (
    <div >

        
        <Toaster theme="dark" offset={'52px'}  position='top-center'
        toastOptions={{
            classNames: {
              toast: 'flex items-center relative',
              closeButton: 'absolute right-2 top-2'  // Position close button at top-right
            },
            style: {
              // Adding padding to account for close button position
              paddingRight: '35px'
            }
          }}
        />

    </div>
  );
};

export default Alert;
// Line Complexity  0.3->
