import React, { useState } from 'react';
import './Subscription.scss';
import { useSelector } from 'react-redux';
import { selectUserStudio } from '../../app/slices/authSlice';
import { Link } from 'react-router-dom';
import { initialPlans } from '../../data/plans';
import PlanCard from './PlanCard';

// Main Subscription component
function Subscription() {
  const [plans, setPlans] = useState(initialPlans);
  const defaultStudio = useSelector(selectUserStudio);

  const handleStorageChange = (planName, newDefaultPlan) => {
    const updatedPlans = plans.map(plan => 
      plan.name === planName ? { ...plan, defaultPlan: newDefaultPlan } : plan
    );
    setPlans(updatedPlans);
  };

  return (
    <main className="subscription">
      <div className="welcome-section">
        <div className="welcome-content">
          <div className='welcome-message-top user-name'>
            <h1 className='welcome-message'>Pricing <span className='bold'>for</span>  <span className='iconic-gradient'>Everyone</span>!</h1>
            <h2 className='welcome-message'><span className='bold'> Choose</span> the Fotoflow <span className='bold'>plan</span> that's right for you. </h2>
          </div>
        </div>
      </div>
      <div className="plans-container">

      <div className="subscriptions-header">

        <div className="left-section"></div>
        <div className='subscriptions-options'>

          <span className="tag white">BATCH 02</span>
          <div className="view-control">
            <div className="control-wrap">
              <div className="controls">
                  <div className={`control ctrl-draft active`} >Monthly</div>
                  <div className={`control ctrl-all `} >Annual</div>
              </div>
              <div className={`active`}></div>
            </div>
          </div>
          <span className="tag green">Limited Time</span>
        </div>
        <div className="right-section">
          {defaultStudio?.domain && <Link to={`/${defaultStudio.domain}/subscription/history`}>Billing History</Link>}
        </div>

      </div>

        <div className="plans">
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} defaultPlan={plan.defaultPlan} defaultStorage={plan.defaultStorage} onStorageChange={handleStorageChange} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default Subscription;