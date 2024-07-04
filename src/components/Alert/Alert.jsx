import React, { useState, useEffect } from 'react';
import './Alert.scss';
import { useDispatch, useSelector } from 'react-redux';
import { hideAlert, selectAlertMessage, selectAlertShow, selectAlertType, } from '../../app/slices/alertSlice';

const Alert = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectAlertShow);
  const type = useSelector(selectAlertType);
  const message = useSelector(selectAlertMessage);

  console.log(show, type, message);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        dispatch(hideAlert())
      }, 1500); // Hide after 1 second
    }
  }, [show]);

  const alertClass = `alert ${type} ${visible ? 'show' : ''}`;

  return (
    <div className={alertClass}>

        <div dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
};

export default Alert;
