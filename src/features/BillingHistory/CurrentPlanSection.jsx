import React from 'react';
import { getDaysFromNow, getEventTimeAgo } from '../../utils/dateUtils'; // Assuming these utilities are available

// CurrentPlanSection component displays the details of the user's current subscription plan.
// It receives the current subscription and studio details as props.
export default function CurrentPlanSection({ currentSubscription, studio }) {
  return (
    <div className="current-plan">
      <h2 className="section-title">Current Plan</h2>
      <div className="plan-details">
        {/* Displays the name of the current plan */}
        <div className='current-plan-label'>{currentSubscription?.plan?.name}</div>
        {/* Displays the total price of the current plan and its payment status */}
        <p className='plan-pricing'>
          ₹{currentSubscription?.pricing?.totalPrice / 100}{' '}
          <span
            className={`status-tag ${
              currentSubscription?.billing?.paymentRecived ? 'paid' : currentSubscription?.plan?.type === "free" ? 'free' : 'unpaid'
            }`}
          >
            {currentSubscription?.billing?.paymentRecived ? 'Paid' : currentSubscription?.plan?.type === "free" ? 'Free' : 'Un-paid'}
          </span>
        </p>
        {/* Displays when the current plan expires, calculated using getDaysFromNow utility */}
        <p>
          <strong>Plan Expires </strong>{' '}
          in {getDaysFromNow(currentSubscription?.dates?.endDate)} days
        </p>
        {/* Displays when the free trial ends, calculated using getDaysFromNow utility */}
        <p>
          <strong>Free Trial </strong>{' '}
          ends in {getDaysFromNow(studio?.trialEndDate)}{' '}
          days <span className="trial-progress"></span>
        </p>
      </div>
    </div>
  );
}
