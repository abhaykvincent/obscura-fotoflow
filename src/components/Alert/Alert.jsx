import React, { useState, useEffect } from 'react';
import './Alert.scss';
import { useDispatch, useSelector } from 'react-redux';
import { hideAlert, selectAlertMessage, selectAlertShow, selectAlertType, } from '../../app/slices/alertSlice';

const Alert = () => {
  const dispatch = useDispatch();

  const [visible, setVisible] = useState(false);
  const show = useSelector(selectAlertShow);
  const type = useSelector(selectAlertType);
  const message = useSelector(selectAlertMessage);

  useEffect(() => {
    if (show) {
      setVisible(true);// Alert pops up
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
