import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import './PinReminderModal.scss';

function PinReminderModal({ pin, onComplete }) {
  const visible = useSelector(selectModal);
  const dispatch = useDispatch();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!visible.pinReminder) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
             handleComplete();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible.pinReminder]);

  const handleComplete = () => {
    dispatch(closeModal('pinReminder'));
    if (onComplete) onComplete();
  };

  const onClose = () => dispatch(closeModal('pinReminder'));

  if (!visible.pinReminder) return null;

  return (
    <div className="pin-reminder modal-container">
      <div className="modal island pin-modal">
        <div className="modal-header">
           <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Selection PIN</div>
        </div>
        <div className="modal-body">
          <div className="pin-display-container">
            <p className="pin-instruction">Please remember this PIN to access the selection gallery</p>
            <div className="pin-value-animated">
               {pin?.split('').map((char, index) => (
                 <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>{char}</span>
               ))}
            </div>
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${(countdown / 3) * 100}%` }}></div>
            </div>
            <p className="auto-close-label">Redirecting in {countdown}s...</p>
          </div>
        </div>
        <div className="actions">
           <div className="button secondary" onClick={onClose}>Cancel</div>
           <div className="button primary" onClick={handleComplete}>Open Link Now</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default PinReminderModal;
