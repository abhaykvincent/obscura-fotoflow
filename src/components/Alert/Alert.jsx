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
                duration: 4000,
                position: 'top-center',
                icon: <MonitorPlayIcon />,
            }
        );
        setTimeout(() => {
            dispatch(hideAlert());
        }, 4000);
    }
}, [id]);
;

  /* onst alertClass = `alert ${type} ${visible ? 'show' : ''}`; */

  return (
    <div >

        
        <Toaster theme="dark" offset={'52px'}  position='top-center'
        />

    </div>
  );
};

export default Alert;
// Line Complexity  0.3->
