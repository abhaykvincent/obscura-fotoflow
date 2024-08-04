import React, { useEffect, useState } from 'react';
import './Subscription.scss';

const initialPlans = [
  {
    name: 'Core',
    isCurrentPlan: true,
    pricing: [
      { storage: 8, monthlyPrice: 'Free', yearlyPrice: '₹0', specialOffer: 'First 2 years are on us' },
    ],
    features: ['Selection', 'Gallery', 'Events', 'Teams', 'Financials'],
    coreFeatures: ['Unlimited Projects', '8 GB Storage'],
    expiry: '31 July 2026',
    defaultPlan: 0,
  },
  {
    name: 'Freelancer',
    pricing: [
      { storage: 128, monthlyPrice: '₹990', yearlyPrice: '₹10,000', specialOffer: 'First 2 months on us' },
      { storage: 512, monthlyPrice: '₹2,000', yearlyPrice: '₹20,000', specialOffer: 'First 2 months on us',defaultPlan: true  },
      { storage: 1024, monthlyPrice: '₹3,500', yearlyPrice: '₹35,000', specialOffer: 'First 2 months on us' },
    ],
    defaultPlan: 1,
    defaultStorage: 512,
    features: ['+ 512GB for ₹1,500','+256 GB Cold Storage', 'Everything in Core plan', 'Full Resolution', 'Timeline'],
    coreFeatures: ['Gallery', '128 GB storage'],
    extraFeatures: { Gallery: 'Unlimited' },
  },
  {
    name: 'Studio',
    pricing: [
      { storage: 1024, monthlyPrice: '₹4,000', yearlyPrice: '₹40,000', specialOffer: 'First 2 months on us',defaultPlan: true },
      { storage: 2048, monthlyPrice: '₹6,500', yearlyPrice: '₹65,000', specialOffer: 'First 2 months on us' },
    ],
    defaultStorage: 1024,
    defaultPlan: 0,
    features: ['+1024GB for ₹2,500','+512 GB Cold Storage', 'Everything in Freelancer plan', 'Online Payments', 'Cold Storage Access'],
    coreFeatures: ['AI', 'Bookings', 'Teams', '1024 GB storage'],
    extraFeatures: { AI: 'BETA', Bookings: 'Unlimited' },
    isWaitlist: true,
  },
];


// PlanFeature component
const PlanFeature = ({ feature, highlight }) => (<p className={`features ${highlight ? 'highlight' : ''}`}>{feature}</p>);

// CoreFeature component
const CoreFeature = ({ plan, feature,defaultPlan,defaultStorage, tag, storage , onIncrement, onDecrement }) => {
    if (feature.includes('storage')) {
      console.log(plan.name)
      console.log('Default Plan $:'+ plan.pricing[defaultPlan].storage)
      console.log('Current plan $:'+ storage)
      
      return (
        <h4 className={`customizable  ${tag ? 'beta' : ''}`}>
          <p className={plan.pricing[0].storage>=storage?'hide':''} onClick={onDecrement} disabled={!onDecrement}>-</p>
          <p className={
            defaultStorage === storage
              ? 'green'
              : 'white'
          }>
            {storage} GB
          </p>
          <p className={plan.pricing[plan.pricing.length - 1].storage<=storage?'hide':''} onClick={onIncrement} disabled={!onIncrement}>+</p>
          {tag && <span className='tag'>{tag}</span>}
        </h4>
      );
    }
    return (
      <h4 className={tag ? 'beta' : ''}>
        {feature}
        {tag && <span className='tag'>{tag}</span>}
      </h4>
    );
  };

// PlanCard component
const PlanCard = ({plan, defaultPlan,defaultStorage, onStorageChange }) => {
  let selectedStorage = plan.pricing[plan.defaultPlan].storage;
  const handleIncrement = () => {
    if (plan.pricing[plan.defaultPlan].storage < plan.pricing[plan.pricing.length - 1].storage) {
      onStorageChange(plan.name,defaultPlan+1);
    }
  };
  
  const handleDecrement = () => {
      if (plan.pricing[defaultPlan].storage > plan.pricing[0].storage) {
        let updatedPlan = plan.pricing[defaultPlan-1];
        onStorageChange(plan.name,defaultPlan-1);
      }
  };
  const currentPricing = plan.pricing.find(p => p.storage === selectedStorage);

  return (
    <div className={`plan ${plan.name.toLowerCase()} ${plan.expiry ? 'active' : ''}`}>
      {plan.isCurrentPlan && <div className="current-plan button primary outline">Current Plan</div>}
      <h3 className="plan-name">{plan.name}</h3>
      <div className="cover"></div>
      <div className="plan-pricing amount">
        <h1>{currentPricing?.monthlyPrice}</h1>
        {currentPricing?.monthlyPrice == 'Free'?<div className="unit"> * </div>:<div className="unit">/ month</div>}
      </div>
      <div className="plan-pricing amount yearly">
        <h1>{currentPricing?.yearlyPrice}</h1>
        <div className="unit"><span>{plan.yearlyDiscount}</span> / year</div>
      </div>
      <div className="plan-pricing yearly">
        <div className="first-month">{currentPricing?.specialOffer}</div>
      </div>
      <div className="core-features">
        {plan.coreFeatures.map((feature, index) => (
          <CoreFeature
            key={index}
            feature={feature}
            tag={plan.extraFeatures && plan.extraFeatures[feature]}
            plan={plan}
            defaultPlan={defaultPlan}
            defaultStorage={defaultStorage}
            storage={plan.pricing[defaultPlan].storage}
            onIncrement={feature.includes('storage') ? handleIncrement : undefined}
            onDecrement={feature.includes('storage') ? handleDecrement : undefined}
          />
        ))}
      </div>
      <div className="plan-features">
        {plan.features.map((feature, index) => (
          <PlanFeature key={index} feature={feature} highlight={feature.includes('Everything in') || feature.includes('₹')} />
        ))}
      </div>
      {plan.expiry && (
        <div className="validity">
          <p className='label'>Plan expries on</p>
          <p>{plan.expiry}</p>
        </div>
      )}
      {!plan.isCurrentPlan && (
        <>
          <p className='waitlist-label'>{plan.isWaitlist ? 'Apply for next available batch.' : 'Pay Later in 7 days'}</p>
          <div className={`button primary ${plan.isWaitlist ? 'outline' : ''}`}>
            {plan.isWaitlist ? 'Join Waitlist' : 'Purchase'}
          </div>
        </>
      )}
    </div>
  )
}

// Main Subscription component
function Subscription() {
  const [plans, setPlans] = useState(initialPlans);
  //reset plans to initialPlans in appropriate interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPlans(initialPlans);
    }, 20000);
    return () => clearInterval(interval);
  }, [plans])

  const handleStorageChange = (planName, newDefaultPlan) => {
    // Create a new array with the updated plan
    const updatedPlans = plans.map(plan => 
      plan.name === planName ? { ...plan, defaultPlan: newDefaultPlan } : plan
    );
    console.log(newDefaultPlan)
    console.log(updatedPlans)
    
    // Update state with the new array
    setPlans(updatedPlans);
  };


    useEffect(() => {
      console.log(plans)
    }, [plans]);
  return (
    <main className="subscription">
      <div className="welcome-section">
        <div className="welcome-content">
          <div className='welcome-message-top user-name'>
            <h1 className='welcome-message'>Upgrade to <span className='iconic-gradient'>Studio Plan</span>!</h1>
            <h2 className='welcome-message'>Manage you <span className='bold'>Payments</span> & <span className='bold'>Crew.</span> </h2>
          </div>
        </div>
      </div>
      <div className="plans-container">
        <h1 className='subscriptions-heading'>
          Pricing 
          <span className="tag green">BATCH 02</span>
          <span className="tag white">Limited Time</span>
          </h1>
        <div className="plans">
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} plans={plans} defaultPlan={plan.defaultPlan} defaultStorage={plan.defaultStorage} onStorageChange={handleStorageChange} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default Subscription;
// Line Complexity  1.0 -> 1.5 -> 1.3