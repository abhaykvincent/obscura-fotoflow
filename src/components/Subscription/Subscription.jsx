import React, { useEffect, useState } from 'react';
import './Subscription.scss';
import { formatStorage } from '../../utils/stringUtils';

const initialPlans = [
  {
    name: 'Core',
    isCurrentPlan: true,
    pricing: [
      { storage: 5, monthlyPrice: 'Free', yearlyPrice: '₹0', specialOffer: ['for 16 months.','No Credit Card Required']},
    ],
    features: [''],
    coreFeatures: ['5 GB Storage','','Gallery','Selection'],
    expiry: '31 July 2026',
    defaultPlan:0 ,
  },
  {
    name: 'Hobbiest',
    pricing: [
      { storage: 10, monthlyPrice: '₹320',monthlyPriceWas: '₹400', yearlyPrice: '₹10,000', specialOffer: ['for 2 months.','Save up to ₹160 with offer',' ₹400/month after'],defaultPlan: true   },
     
    ],
    defaultPlan: 0,
    defaultStorage: 50,
    features: ['Everything in Core plan','1 MB File Size', '10K Photos'],
    coreFeatures: [,'10 GB Cold Storage','','','','',''],
    extraFeatures: { Gallery: 'Unlimited',Financials: 'Unlimited','Cold Storage': 'Limited'},
    isAddStorage: true,
  },
  {
    name: 'Freelancer',
    pricing: [
      { storage: 100, monthlyPrice: '₹480',monthlyPriceWas: '₹980', yearlyPrice: '₹10,000', specialOffer: ['for 2 months.','Save up to ₹1,000 with offer',' ₹980/month after'],defaultPlan: true   },
     
    ],
    defaultPlan: 0,
    defaultStorage: 100,
    coreFeatures: [ 'Invoicing','e-Invitation','',''],
    features: ['+ 50 GB Cold Storage', 'Everything in Core plan','5 MB File Size','100K Photos'],
    extraFeatures: { Gallery: 'Unlimited',Financials: 'Unlimited'},
  },
  {
    name: 'Studio',
    pricing: [
      { storage: 1024, monthlyPrice: '₹1,480',monthlyPriceWas: '₹2,800', yearlyPrice: '₹1,00,000', specialOffer: ['for 2 months.','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
      { storage: 5000, monthlyPrice: '₹3,500',monthlyPriceWas: '₹9,000', yearlyPrice: '₹3,00,000', specialOffer: ['for 2 months.','Save up to ₹4300 with offer',' ₹9,000/month after'] },
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: [ 'Custom','Website', 'Bookings'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan','Original File Size','1 Million Photos'],
    extraFeatures: { AI: 'Beta',},
  

  },
  /* {
    name: 'Agency',
    pricing: [
      { storage: 5120, monthlyPrice: '₹4,000',monthlyPriceWas: '₹9,000', yearlyPrice: '₹3,00,000', specialOffer: ['for 2 months. 1 Year Contract','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: [ 'Teams','Print Shop','Agency Portfolio', 'Google Calendar'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan'],
    isContactSales: true,
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Print-Shop',
    pricing: [
      { storage: 5120, monthlyPrice: '₹4,000',monthlyPriceWas: '₹9,000', yearlyPrice: '₹3,00,000', specialOffer: ['for 2 months. 1 Year Contract','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: [ 'Teams','Print Shop','Agency Portfolio', 'Google Calendar'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan'],
    isContactSales: true,
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Premium',
    pricing: [
      { storage: 5120, monthlyPrice: '₹0',monthlyPriceWas: '₹19,000', yearlyPrice: '₹5,00,000', specialOffer: ['for 2 months. 1 Year Contract','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
    ],
    defaultStorage: 10000,
    defaultPlan: 0,
    coreFeatures: [ 'Flow AI','Print Shop','Agency Portfolio', 'Google Calendar'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan'],
    isContactSales: true,
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Enterprise',
    pricing: [
      { storage: 10200, monthlyPrice: '',monthlyPriceWas: '', yearlyPrice: '', specialOffer: ['5 Year Contract'],defaultPlan: true},
    ],
    defaultStorage: 10000,
    defaultPlan: 0,
    coreFeatures: [ 'Flow AI','','', ''],
    features: [],
    extraFeatures: { AI: 'Beta',},
    isContactSales: true,
  }, */
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
      <h3 className="plan-name">{plan.name}</h3>
      
      <div className="cover"></div>
      <p className={`
          storage-counter
            ${defaultStorage === plan.pricing[defaultPlan].storage
              ? 'green'
              : 'white'}`
          }>
            {formatStorage(plan.pricing[defaultPlan].storage,"GB")} 
          </p>
      <div className="plan-pricing amount monthly">
        <h1>
          <span className="priceWas">{currentPricing?.monthlyPriceWas}</span> 
          <span className="priceNow">{currentPricing?.monthlyPrice}</span> 
        </h1>
        {currentPricing?.monthlyPrice == 'Free'?<div className="unit"> * </div>:<div className="unit">/mo</div>}
      </div>
      <div className="plan-pricing yearly">
        <div className="first-month">{currentPricing?.specialOffer[0]}</div>
        <div className="first-month iconic">{currentPricing?.specialOffer[1]}</div>
        <div className="first-month">{currentPricing?.specialOffer[2]}</div>
      </div>
      
      {!plan.isCurrentPlan && (
        <>
          <p className='waitlist-label'>{plan.isAddStorage ? 'Pay with UPI' : plan.isContactSales?'':' No CC Requ. Pay Later in 14 days.'}</p>
          <div className={`button  ${plan.isWaitlist || plan.isAddStorage ? ' secondary' : plan.isContactSales?'primary outline':'primary'}`}>
            {plan.isWaitlist ? 'Join Waitlist' : plan.isAddStorage ? 'Buy Cold Storage': plan.isContactSales?'Contact Sales':'Get Started'}
            
          </div>
        </>
      )}

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
          <PlanFeature key={index} feature={feature} highlight={feature.includes('Everything in') || feature.includes('Cold Storage')} />
        ))}
      </div>
      {plan.expiry && (
        <div className="validity">
          <p className='label'>Plan expries on</p>
          <p>{plan.expiry}</p>
        </div>
      )}
      {plan.isCurrentPlan && <div className="current-plan button primary outline">Current Plan</div>}

      
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
            <h1 className='welcome-message'>Plans for <span className='iconic-gradient'>Everyone</span>!</h1>
            <h2 className='welcome-message'>Choose the Fotoflow <span className='bold'>plan</span> that's  <span className='bold'>right </span> for you. </h2>
          </div>
        </div>
      </div>
      <div className="plans-container">

      <div className="subscriptions-header">

        <div className="left-section"></div>
        <h1 className='subscriptions-heading'>
          Pricing 
          <span className="tag green">BATCH 02</span>
          <span className="tag white">Limited Time</span>
        </h1>
        <div className='subscriptions-options'>
          <div className="view-control">
            <div className="control-wrap">
              <div className="controls">
                  <div className={`control ctrl-draft`} >Monthly</div>
                  <div className={`control ctrl-all active`} >Annual</div>
              </div>
              <div className={`active`}></div>
            </div>
          </div>
        </div>

      </div>

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