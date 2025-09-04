import React from 'react';
import { useSelector } from 'react-redux';
import { formatStorage } from '../../utils/stringUtils';
import { selectUserStudio } from '../../app/slices/authSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { changeSubscriptionPlan } from '../../firebase/functions/subscription';
import { getDaysFromNow } from '../../utils/dateUtils';
import RazorpayButton from './RazorpayButton';

export default function PlanCard({plan, defaultPlan, defaultStorage, onStorageChange, billingCycle }) {
  const defaultStudio = useSelector(selectUserStudio);
  const studio = useSelector(selectStudio);

  let selectedStorage = plan.pricing[plan.defaultPlan].storage;
  const currentPricing = plan.pricing.find(p => p.storage === selectedStorage);

  const handlePlanChange = async () => {
    if (!plan.isWaitlist && !plan.isAddStorage && !plan.isContactSales) {
      try {
        await changeSubscriptionPlan(defaultStudio.domain,  plan.name.toLowerCase());
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
  const unit = price === 'Free' ? '*' : (billingCycle === 'monthly' ? '/mo' : '/yr');

  return (
    <div className={`plan ${plan.name.toLowerCase()} ${studio?.subscriptionId?.includes(plan.name.toLowerCase())  ? 'active' : ''}`}>
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
      <div className={`plan-pricing amount ${billingCycle}`}>
        <h1>
          <span className="priceWas">{priceWas}</span> 
          <span className="priceNow">{price}</span> 
        </h1>
        <div className="unit">{unit}</div>
      </div >
      <div className="plan-pricing yearly">
        <div className="first-month contract-period">{currentPricing?.specialOffer[0]}</div>
        <div className="first-month iconic">{currentPricing?.specialOffer[1]}</div>
        <div className="first-month">{currentPricing?.specialOffer[2]}</div>
      </div>
      
      { 
        <div className={`validity ${plan.expiry ? '' : 'hide'}`}>
          <p className='label'>Free plan will expries on</p>
          <p>{plan.expiry}</p>
        </div>
      }
      <p className='waitlist-label'>{
        studio?.subscriptionId?.includes(plan.name.toLowerCase()) ? 
        <span className="expiry-label">{`Trial ends in ${ getDaysFromNow(studio?.trialEndDate)} days`}</span> :
        plan.name.toLowerCase() !== 'core' && <span className="expiry-label">{`Pay later in ${ getDaysFromNow(studio?.trialEndDate)} days`}</span>}
      </p>
      {studio?.subscriptionId?.includes(plan.name.toLowerCase()) && <div className="current-plan button primary outline">Current Plan</div>}
      { !studio?.subscriptionId?.includes(plan.name.toLowerCase()) && 
        <div 
          className={`button ${plan.isWaitlist || plan.isAddStorage ? ' primary outline' : plan.isContactSales ? 'primary outline' : 'primary outline'}`}
          onClick={handlePlanChange}
        >
          {getButtonText()}
        </div>}
      { studio?.subscriptionId?.includes(plan.name.toLowerCase()) &&
        (plan.name === "Studio" ?
        <RazorpayButton payment_button_id='pl_PmVGqJ2gzI0OLI' planame={plan.name}/>
        : plan.name === "Freelancer" ?
          <RazorpayButton payment_button_id='pl_Pmcdje8Dbj3cYR'  planame={plan.name}/>
          :
          plan.name === "Company" ?
            <RazorpayButton payment_button_id='pl_PmcfmE5GTfrnNY'  planame={plan.name}/>
            : <></>)
      }
      <p className='waitlist-label'>{plan.name==='Core' ? ' ' : plan.isContactSales ? 'Talk to a sales. Book Demo' : ' Pay with UPI . Lock the price.'}</p>
    </div>
  )
}