// Assume Firestore is initialized as 'db'
import { db, storage } from "../app";
import { doc, getDoc, setDoc, updateDoc, collection} from 'firebase/firestore';
// Helper function to add months to a date (simplified, use a library like date-fns in production)
function addMonths(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

// Helper function to add years to a date
function addYears(dateStr, years) {
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
}

// Placeholder function to get plan details by planId
// In practice, this could fetch from a database or use a static map
function getPlanDetails(planId) {
  const plans = {
    'core-free': {
      name: 'Core',
      type: 'free',
      pricing: [{ storage: 5000, monthlyPrice: 0, yearlyPrice: 0 }],
    },
    'freelancer': {
      name: 'Freelancer',
      type: 'paid',
      pricing: [{ storage: 100000, monthlyPrice: 980, yearlyPrice: 10000 }],
    },
    'studio': {
      name: 'Studio',
      type: 'paid',
      pricing: [{ storage: 1000000, monthlyPrice: 1020, yearlyPrice: 25000 }],
    },
    'company': {
      name: 'Company',
      type: 'paid',
      pricing: [{ storage: 5000000, monthlyPrice: 15000, yearlyPrice: 150000 }],
    },
  };
  return plans[planId];
}

// Placeholder for Razorpay payment initiation
// Replace with actual Razorpay API integration
async function initiateRazorpayPayment(amount) {
  // Simulate payment success for now
  // In reality, create a Razorpay order and handle payment confirmation
  console.log(`Initiating payment for ₹${amount}`);
  return true; // Assume payment succeeds
}




/**
 * Changes a studio's subscription plan, handling upgrades and downgrades with prorated billing
 * and storage limit management.
 * @param {string} studioId - The ID of the studio
 * @param {string} newPlanId - The ID of the new plan (e.g., 'freelancer', 'studio')
 * @returns {Promise<{ success: boolean, message: string }>}
 */

export async function changeSubscriptionPlan(studioId, newPlanId) {
  try {
    // **Step 1: Fetch the studio document**
    const studioRef = doc(db, 'studios', studioId);
    const studioDoc = await getDoc(studioRef);
    if (!studioDoc.exists()) {
      throw new Error('Studio not found');
    }
    const studioData = studioDoc.data();

    // **Step 2: Fetch the current subscription**
    const currentSubscriptionId = studioData.subscriptionId;
    const subscriptionRef = doc(db, 'subscriptions', currentSubscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    if (!subscriptionDoc.exists()) {
      throw new Error('Current subscription not found');
    }
    const subscriptionData = subscriptionDoc.data();

    // **Step 3: Get current and new plan details**
    const currentPlanId = subscriptionData.plan.planId;
    const currentPlan = getPlanDetails(currentPlanId);
    const newPlan = getPlanDetails(newPlanId);
    console.log("new",newPlanId)
    if (!currentPlan || !newPlan) {
      throw new Error('Invalid plan');
    }

    // Check if switching to the same plan
    if (currentPlanId === newPlanId) {
      throw new Error('Cannot switch to the same plan');
    }

    // **Step 4: Determine billing cycle and prices**
    const billingCycle = subscriptionData.billing.billingCycle;
    const currentPrice = currentPlan.pricing[0][billingCycle + 'Price'];
    const newPrice = newPlan.pricing[0][billingCycle + 'Price'];

    // **Step 5: Calculate prorated amount**
    const startDate = new Date(subscriptionData.dates.startDate);
    const endDate = new Date(subscriptionData.dates.endDate);
    const currentDate = new Date();

    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const remainingDays = (endDate - currentDate) / (1000 * 60 * 60 * 24);

    if (remainingDays <= 0) {
      throw new Error('Current subscription has expired');
    }

    const proratedFactor = remainingDays / totalDays;
    let charge = 0;
    let credit = 0;

    // **Step 6: Handle upgrade or downgrade**
    if (newPrice > currentPrice) {
      // Upgrade: Charge prorated difference
      charge = (newPrice - currentPrice) * proratedFactor;
      const paymentSuccess = await initiateRazorpayPayment(charge);
      if (!paymentSuccess) {
        throw new Error('Payment failed');
      }
    } else {
      // Downgrade: Calculate credit
      credit = (currentPrice - newPrice) * proratedFactor;
    }

    // **Step 7: Create new subscription document**
    const newSubscriptionId = `${studioId}-${newPlanId}-${currentDate.toISOString().split('T')[0]}`;
    const newStartDate = currentDate.toISOString().split('T')[0];
    let newEndDate;

    if (billingCycle === 'monthly') {
      newEndDate = addMonths(newStartDate, 1);
    } else if (billingCycle === 'yearly') {
      newEndDate = addYears(newStartDate, 1);
    }

    const newSubscriptionDoc = {
      id: newSubscriptionId,
      studioId: studioId,
      plan: {
        planId: newPlanId,
        name: newPlan.name,
        type: newPlan.type,
      },
      billing: {
        billingCycle: billingCycle,
        autoRenew: false,
        paymentPlatform: newPlan.type === 'free' ? null : 'razorpay',
        paymentMethod: null,
      },
      dates: {
        startDate: newStartDate,
        endDate: newEndDate,
        trialEndDate: null,
      },
      pricing: {
        basePrice: newPrice,
        discount: 0,
        tax: 0,
        currency: 'INR',
        totalPrice: newPrice,
      },
      status: 'active',
      credit: credit,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: studioId,
        updatedBy: studioId,
      },
    };

    const newSubscriptionRef = doc(db, 'subscriptions', newSubscriptionId);
    await setDoc(newSubscriptionRef, newSubscriptionDoc);

    // **Step 8: Manage storage limits for downgrade**
    const isDowngrade = newPlan.pricing[0].storage < currentPlan.pricing[0].storage;
    const usageExceedsLimit = studioData.usage.storage.used > newPlan.pricing[0].storage;
    let storageGracePeriodEnd = null;

    if (isDowngrade && usageExceedsLimit) {
      // Set 30-day grace period
      storageGracePeriodEnd = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const newStorageQuota = newPlan.pricing[0].storage;
    console.log(newStorageQuota)
    // **Step 9: Update studio document**
    await updateDoc(studioRef, {
      subscriptionId: newSubscriptionId,
      'usage.storage.quota': newStorageQuota, // Update storage quota to new plan's limit
      storageGracePeriodEnd: storageGracePeriodEnd,
    });

    return { success: true, message: 'Subscription changed successfully' };
  } catch (error) {
    console.error('Error changing subscription:', error.message);
    throw error;
  }
}

// Example usage
/* async function testChangeSubscriptionPlan() {
  try {
    const result = await changeSubscriptionPlan('studio123', 'freelancer');
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
} */

// Uncomment to test
// testChangeSubscriptionPlan();