import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { showAlert } from '../../../app/slices/alertSlice';
import { selectCurrentSubscription, selectStudio } from '../../../app/slices/studioSlice';

function TrialStatusModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const subscription = useSelector(selectCurrentSubscription);
  const studio = useSelector(selectStudio);

  const formatDate = (date) => date.toLocaleDateString();

  const getTrialStatus = () => {
    const currentDate = new Date();
    const trialEndDate = studio?.trialEndDate ? new Date(studio?.trialEndDate) : null;
    const gracePeriodEnd = trialEndDate ? new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;


    if (trialEndDate && currentDate < trialEndDate && (trialEndDate - currentDate) / (1000 * 60 * 60 * 24) <= 3) {
      return {
        type: 'endsSoon',
        className: 'trial-ending-soon',

        title:'Your trial is ending soon!',
        messages: [
          `It expires on ${formatDate(trialEndDate)}.`,
          'Upgrade now to maintain full access to all features.'
        ],
        actionText: 'Pay Now',
        actionPath: '/pricing',
      };
    } else if (trialEndDate && currentDate > trialEndDate && currentDate <= gracePeriodEnd) {
      return {
        type: 'gracePeriod',
        className: 'grace-period-active',
        title:`Your trial expired on ${formatDate(trialEndDate)}.`,
        messages: [
          `May affect some of your projects.`,
          'Pay now to avoid outage.'
        ],
        actionText: 'Pay Now',
        actionPath: `/${studio.domain}/subscription`,
      };
    } else if (trialEndDate && currentDate > gracePeriodEnd ) {
      return {
        type: 'switchedToFree',
        className: 'free-plan-switched',
        title:'Your trial and grace period have ended.',
        messages: [
          'You’ve been automatically switched to the free Core plan.',
          'This includes 5 GB of storage with basic features.'
        ],
        actionText: 'View Plans',
        actionPath: '/pricing',
      };
    }
    return null;
  };

  const trialStatus = getTrialStatus();

  const onClose = () => {
    dispatch(closeModalWithAnimation('trialStatus'));
  };

  const handleAction = (path) => {
    onClose();
    setTimeout(() => {
      navigate(path);
      dispatch(showAlert({ type: 'info', message: 'Check out our plans to upgrade your subscription!' }));
    }, 300);
  };
  if (!visible.trialStatus || !trialStatus) return null;
  return (
    <div className="modal-container">
      <div className={`modal trial-status island ${trialStatus.className}`}>
        <div className="modal-header">
          <div className="modal-controls">
          </div>
          <div className="modal-title">
            {trialStatus.type === 'endsSoon' && 'Trial Ending Soon'}
            {trialStatus.type === 'gracePeriod' && 'Trial Expired '}
            {trialStatus.type === 'switchedToFree' && 'Switched to Free Plan'}
            <p className="modal-subtitle">Subscription Update</p>
          </div>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <h2>{trialStatus.title}</h2>
            {trialStatus.messages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        </div>
        <div className="actions">
          <button className="button secondary" onClick={onClose}>
            {trialStatus.type === 'switchedToFree' ? 'Close' : 'Skip for now'}
          </button>
          <button
            className="button primary"
            onClick={() => handleAction(trialStatus.actionPath)}
          >
            {trialStatus.actionText}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default TrialStatusModal;