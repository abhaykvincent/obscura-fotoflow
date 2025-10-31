import React, { useState, useEffect } from 'react';
import { addBudget, addPayment } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { formatDecimal } from '../../utils/stringUtils';
import { selectDomain } from '../../app/slices/authSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { initialPlans } from '../../data/plans';
import PlanCard from './PlanCard';
import { retrieveLimitContext, storeLimitContext } from '../../utils/localStorageUtills';

export default function UpgradeModal({ project, context }) {
  const dispatch = useDispatch();
  const domain = useSelector(selectDomain);
  const visible = useSelector(selectModal);
  const onClose = () => dispatch(closeModalWithAnimation('upgrade'));
  const modalRef = useModalFocus(visible.upgrade);

  const [plans, setPlans] = useState(initialPlans);

  const handleStorageChange = (planName, newDefaultPlan) => {
    const updatedPlans = plans.map(plan =>
      plan.name === planName ? { ...plan, defaultPlan: newDefaultPlan } : plan
    );
    setPlans(updatedPlans);
  };

  if (!visible.upgrade) return null;

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal upgrade island">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Upgrade</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            <div className="upgrade-content">{retrieveLimitContext()}</div>
            <div className="plans">
              {plans.map((plan, index) => (
                <PlanCard
                  key={index}
                  plan={plan}
                  defaultPlan={plan.defaultPlan}
                  defaultStorage={plan.defaultStorage}
                  onStorageChange={handleStorageChange}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Skip for now</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}