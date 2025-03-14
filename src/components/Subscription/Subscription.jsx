import React, { useEffect, useState } from 'react';
import './Subscription.scss';
import { formatStorage } from '../../utils/stringUtils';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserStudio } from '../../app/slices/authSlice';
import { changeSubscriptionPlan } from '../../firebase/functions/subscription';
import { fetchStudio, selectStudio } from '../../app/slices/studioSlice';

export const initialPlans = [
  {
    name: 'Core',
    isCurrentPlan: true,
    pricing: [
      { storage: 5, monthlyPrice: 'Free', yearlyPrice: '₹0', specialOffer: ['for 12 months.','No Credit Card Required']},
    ],
    features: ['3 galleries/project','3 new projects/month'],
    coreFeatures: ['5 GB Storage','','Gallery','Selection'],
    expiry: '31 July 2026',
    defaultPlan:0 ,
  },
  {
    name: 'Freelancer',
    pricing: [
      { storage: 100, monthlyPrice: '₹980',monthlyPriceWas: '', yearlyPrice: '₹10,000', specialOffer: ['.','Welcome Offer','Core +'],defaultPlan: true   },
     
    ],
    defaultPlan: 0,
    defaultStorage: 100,
    coreFeatures: ['Gallery','Selection','Financials','e-Invitation'],
    features: [ 'Unlimited Projects','12 Galleries/month','+Everything in Core plan'],
    extraFeatures: {},
  },
  {
    name: 'Studio',
    pricing: [
      { storage: 1024, 
        monthlyPrice: '₹1,020',monthlyPriceWas: '₹2,800', yearlyPrice: '₹25,000', 
        specialOffer: ['for 2 months.','Offer expires soon!',' ₹2,800/month after'],
        defaultPlan: true},
      
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: ['Website', 'Portfolio','Bookings'],
    features: [ 'Unlimited Galleries','1 Million Photos','+Everything in Freelancer plan'],
    extraFeatures: { AI: 'Beta',},
  },,
  {
    name: 'Company',
    pricing: [
      { storage: 5120, monthlyPrice: '₹2,800',monthlyPriceWas: '₹4,800', yearlyPrice: '₹1,00,000', specialOffer: ['for 2 months.','Save up to ₹8,640 with offer',' ₹4,800/month after'],defaultPlan: true},
      
    ],
    defaultStorage: 5000,
    defaultPlan: 0,
    coreFeatures: [ 'Multi-studio','Custom Domain','Addon Storage'],
    features: [ 'Unlimited Bandwidth','Original File Size','+Everything in Studio plan'],
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

const RazorpayButton = ({payment_button_id}) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.async = true;
    script.dataset.payment_button_id = payment_button_id;
    
    const style = document.createElement('style');
    style.innerHTML = `
    form{
      margin-top: 10px !important;
    }
    .razorpay-payment-button .PaymentButton{
      border-radius: 20px !important;
        
    }
    .PaymentButton-contents{
      margin-top: -0px !important;
      padding: 4px 62px 4px 62px  !important
    }  
    `
    document.head.appendChild(style);
    const form = document.getElementById(payment_button_id);
    form.appendChild(script);
    return () => {
      form.removeChild(script);
    };
  }, []);

  return <form id={payment_button_id}></form>;
};
const openWhatsAppMessage = (studio,plan, pricing) => {
  console.log(studio,plan, pricing)
  const message = `Upgrade to ${plan.name} Plan (${formatStorage(pricing.storage, "GB")}).%0AStudio name: ${studio}%0A${pricing.monthlyPrice}/mo for 2 months%0AThereafter ${pricing.monthlyPriceWas}/mo %0ASend UPI code for Paying ${pricing.monthlyPrice} for the first month.`;
  
  window.open(`https://wa.me/+916235099329?text=${message}`, '_blank');
};

// PlanFeature component
const PlanFeature = ({ feature, highlight }) => (<p className={`features ${highlight ? 'highlight' : ''}`}>{feature}</p>);
// CoreFeature component
const CoreFeature = ({ plan, feature,defaultPlan,defaultStorage, tag, storage , onIncrement, onDecrement }) => {
    if (feature.includes('storage')) {

      
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
export const PlanCard = ({plan, defaultPlan,defaultStorage, onStorageChange }) => {
  const dispatch = useDispatch();
  const defaultStudio = useSelector(selectUserStudio);
  const studio = useSelector(selectStudio);
  console.log(studio?.subscriptionId)
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
      </div >
      <div className="plan-pricing yearly">
        <div className="first-month">{currentPricing?.specialOffer[0]}</div>
        <div className="first-month iconic">{currentPricing?.specialOffer[1]}</div>
        <div className="first-month">{currentPricing?.specialOffer[2]}</div>
      </div>
      
      
      

      {/* <div className="core-features">
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
      </div> */}
      {/* <div className="plan-features">
        {plan.features.map((feature, index) => (
          <PlanFeature key={index} feature={feature} highlight={feature.includes('Unlimited') || feature.includes('Cold Storage')} />
        ))}
      </div> */}
      
      {!plan.name.includes('Core') && (
        <>

          <p className='waitlist-label'>{studio?.subscriptionId?.includes(plan.name.toLowerCase()) ? 'Expires in ' :' Pay Later in 14 days..'}</p>
          {studio?.subscriptionId?.includes(plan.name.toLowerCase()) && <div className="current-plan button primary outline">Current Plan</div>}
          { !studio?.subscriptionId?.includes(plan.name.toLowerCase()) && 
            <div 
            className={`button ${plan.isWaitlist || plan.isAddStorage ? ' primary outline' : plan.isContactSales ? 'primary outline' : 'primary outline'}`}
            
            // Plan selection logic
            onClick={async () => {
              if (!plan.isWaitlist && !plan.isAddStorage && !plan.isContactSales) {
                try {
                  console.log(plan)
                  await changeSubscriptionPlan(defaultStudio.domain,  plan.name.toLowerCase());
                  console.log('Subscription changed successfully');
                  // refresh the page or update UI to reflect the new plan
                  window.location.reload();
                  // Optionally update UI here (e.g., show a success message)
                } catch (error) {
                  console.error('Error changing subscription:', error.message);
                  // Optionally show an error message to the user
                }
              }
            }}
          >
            {plan.isWaitlist ? 'Join Waitlist' : plan.isAddStorage ? 'Buy Cold Storage': plan.isContactSales ? 'Contact Sales' : 'Try for Free'}
          </div>}

          {
            plan.name === "Studio" ?
            <RazorpayButton payment_button_id='pl_PmVGqJ2gzI0OLI' />
            : plan.name === "Freelancer" ?
            <RazorpayButton payment_button_id='pl_Pmcdje8Dbj3cYR' />
            :
            <RazorpayButton payment_button_id='pl_PmcfmE5GTfrnNY' />
            
          }
          <p className='waitlist-label'>{plan.isAddStorage ? ' Secure offer price. Pay with UPI' : plan.isContactSales ? ' Pay with UPI .  Secure offer price.' : ' Pay with UPI . Secure offer.'}</p>
        </>
      )}
      {plan.expiry && (
        <div className="validity">
          <p className='label'>Plan expries on</p>
          <p>{plan.expiry}</p>
        </div>
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
    // Update state with the new array
    setPlans(updatedPlans);
  };


    useEffect(() => {
    }, [plans]);
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