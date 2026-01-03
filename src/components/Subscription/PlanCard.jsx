import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { formatStorage } from '../../utils/stringUtils';
import { selectUserStudio } from '../../app/slices/authSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { changeSubscriptionPlan } from '../../firebase/functions/subscription';
import { getDaysFromNow } from '../../utils/dateUtils';
import RazorpayButton from './RazorpayButton';

export default function PlanCard({plan, defaultPlan, defaultStorage, onStorageChange, billingCycle, showPaidFeatures, setShowPaidFeatures }) {
  const defaultStudio = useSelector(selectUserStudio);
  const studio = useSelector(selectStudio);
  const [localShowAllFeatures, setLocalShowAllFeatures] = useState(false);

  const isPaidPlan = ['freelancer', 'studio'].includes(plan.name.toLowerCase());
  const shouldUseShared = isPaidPlan && showPaidFeatures !== undefined && setShowPaidFeatures !== undefined;

  const showAllFeatures = shouldUseShared ? showPaidFeatures : localShowAllFeatures;

  const toggleFeatures = () => {
    if (shouldUseShared) {
      setShowPaidFeatures(!showPaidFeatures);
    } else {
      setLocalShowAllFeatures(!localShowAllFeatures);
    }
  };

  let selectedStorage = plan.pricing[defaultPlan]?.storage;
  const currentPricing = plan.pricing.find(p => p.storage === selectedStorage) || plan.pricing[0];

  const isCurrentPlan = () => {
    if (!studio?.subscriptionId) return false;
    const lowerName = plan.name.toLowerCase();
    if (studio.subscriptionId.includes(lowerName)) return true;
    if (lowerName === 'free' && studio.subscriptionId.includes('core')) return true;
    if (lowerName === 'enterprise' && studio.subscriptionId.includes('company')) return true;
    return false;
  };

  const isActive = isCurrentPlan();

  const handlePlanChange = async () => {
    if (!plan.isWaitlist && !plan.isAddStorage && !plan.isContactSales) {
      try {
        let planId = plan.name.toLowerCase();
        if (planId === 'free') planId = 'core'; 
        
        await changeSubscriptionPlan(defaultStudio.domain, planId);
        console.log('Subscription changed successfully');
        window.location.reload();
      } catch (error) {
        console.error('Error changing subscription:', error.message);
      }
    }
  };

  const getButtonText = () => {
    if (plan.isWaitlist) return 'Join Waitlist';
    if (plan.isAddStorage) return 'Buy Cold Storage';
    if (plan.isContactSales) return 'Contact Sales';
    if (studio?.subscriptionId?.includes('freelancer') && plan.name === "Studio") return 'Upgrade for Free';
    if (studio?.subscriptionId?.includes('studio') && plan.name === "Freelancer") return 'Downgrade';
    return 'Use for Free';
  };

  let price = billingCycle === 'monthly' ? currentPricing?.monthlyPrice : currentPricing?.yearlyPrice;
  if (price === '₹0') price = 'Free';

  const priceWas = billingCycle === 'monthly' ? currentPricing?.monthlyPriceWas : '';
  const unit = price === 'Free' || price === 'Custom' ? '' : (billingCycle === 'monthly' ? '/mo' : '/yr');

  const visibleFeatures = showAllFeatures ? plan.features : plan.features.slice(0, 3);

  return (
    <div className={`plan ${plan.name.toLowerCase()} ${isActive ? 'active' : ''}`}>
       {plan.extraFeatures?.badge && <div className="badge">{plan.extraFeatures.badge}</div>}
      <h3 className="plan-name">{plan.name}</h3>
      
      <div className="cover"></div>
      <p className={` 
        storage-counter
        ${defaultStorage === plan.pricing[defaultPlan].storage
          ? 'green'
          : 'white'}`
      }>
        {typeof plan.pricing[defaultPlan].storage === 'number' ? formatStorage(plan.pricing[defaultPlan].storage,"GB") : plan.pricing[defaultPlan].storage} 
      </p>
      <div className={`plan-pricing amount ${billingCycle}`}>
        <h1>
          <span className="priceWas">{priceWas}</span> 
          <span className="priceNow">{price}</span> 
        </h1>
        <div className="unit">{unit}</div>
      </div >
      <div className="plan-pricing yearly">
        {currentPricing?.specialOffer && currentPricing.specialOffer.map((offer, index) => (
             <div key={index} className={`first-month ${index === 0 ? 'contract-period' : index === 1 ? 'iconic' : ''}`}>{offer}</div>
        ))}
      </div>

      <div className="plan-features">
          {visibleFeatures && visibleFeatures.map((feature, index) => (
              <p key={index}>{feature}</p>
          ))}
          {plan.features && plan.features.length > 2 && (
            
          showAllFeatures ?
              <div  className="see-more-features icon icon-only arrow-up" 
              onClick={toggleFeatures}
            > Show less </div>
              :
              <div 
              className="see-more-features icon icon-only arrow" 
              onClick={toggleFeatures}
            >
              See full features
            </div>
            
          )
          }
      </div>
      
      { 
        <div className={`validity `}>
          <p className='label'>

            {plan.name==="Free" ? ''
                :
                plan.name==="Freelancer" ? " Everything on Core free plan":
                plan.name==="Studio" ? " Everything on Freelancer plan":
                "+ Everything on Studio plan"
            }
          </p>
        </div>
      }
      <p className='waitlist-label'>{
        isActive ? 
        <span className="expiry-label">{`Trial ends in ${ getDaysFromNow(studio?.trialEndDate)} days`}</span> :
        plan.name.toLowerCase() !== 'free' && plan.name.toLowerCase() !== 'core' && <span className="expiry-label">{`Pay later in ${ getDaysFromNow(studio?.trialEndDate)} days`}</span>}
      </p>
      {isActive && <div className="current-plan button secondary ">Current Plan</div>}
      { !isActive && 
        <div 
          className={`button ${plan.name === 'Studio' ? 'primary' : 'primary outline'}`}
          onClick={handlePlanChange}
        >
          {getButtonText()}
        </div>}
      { isActive &&
        (plan.name === "Studio" ?
        <RazorpayButton payment_button_id='pl_PmVGqJ2gzI0OLI' planame={plan.name}/>
        : plan.name === "Freelancer" ?
          <RazorpayButton payment_button_id='pl_Pmcdje8Dbj3cYR'  planame={plan.name}/>
          :
          plan.name === "Enterprise" ?
            <RazorpayButton payment_button_id='pl_PmcfmE5GTfrnNY'  planame={plan.name}/>
            : <></>)
      }
      <p className='waitlist-label'>{plan.name==='Free' || plan.name==='Core' ? ' ' : plan.isContactSales ? 'Talk to a sales. Book Demo' : ' Pay with UPI . Lock the price.'}</p>
    </div>
  )
}