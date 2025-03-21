// Assume Firestore is initialized as 'db'
import { addMonths, addYears } from "../../utils/dateUtils";
import { db, storage } from "../app";
import { doc, getDoc, setDoc, updateDoc, collection, arrayUnion, query, where, getDocs} from 'firebase/firestore';

// Placeholder function to get plan details by planId
// In Productio, this could fetch from a database or use a static map
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
      pricing: [{ storage: 5000000, monthlyPrice: 5000, yearlyPrice: 50000 }],
    },
  };
  return plans[planId];
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

    // **Step 6: Handle upgrade or downgrade (Modified)**
    const newSubscriptionId = `${studioId}-${newPlanId}-${currentDate.toISOString().split('T')[0]}`;

    let invoiceId = null;
    if (newPrice > currentPrice) {
      // Upgrade: Charge prorated difference
      charge = (newPrice - currentPrice) * proratedFactor;
      /* const paymentSuccess = await initiateRazorpayPayment(charge);
      if (!paymentSuccess) {
        throw new Error('Payment failed');
      } */
      // Create invoice for the charge
      invoiceId = await createInvoice(studioId,newPlan, newSubscriptionId, charge, billingCycle, 'paid');
    } else if (newPrice === 0) {
      // Free plan: No charge, just create an invoice with 0 amount
      invoiceId = await createInvoice(studioId, newPlan,newSubscriptionId, 0, billingCycle, 'paid');
    } else {
      // Downgrade: Calculate credit and create invoice with 0 amount (credit handled separately)
      credit = (currentPrice - newPrice) * proratedFactor;
      invoiceId = await createInvoice(studioId, newPlan,newSubscriptionId, 0, billingCycle, 'paid');
    }

    // **Step 7: Create new subscription document (Modified)**
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
        paymentRecived: newPrice > 0 ? true : false, // Updated based on payment
        paymentPlatform: newPlan.type === 'free' ? null : 'razorpay',
        paymentMethod: null,
      },
      dates: {
        startDate: newStartDate,
        endDate: newEndDate,
      },
      pricing: {
        basePrice: newPrice,

        discount: 0,
        tax: newPrice * 0.18,
        currency: 'INR',
        totalPrice: newPrice + newPrice * 0.18,
      },
      status: 'active',
      credit: credit,
      invoiceId: invoiceId, // Add reference to the invoice
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: studioId,
        updatedBy: studioId,
      },
    };

    const newSubscriptionRef = doc(db, 'subscriptions', newSubscriptionId);
    await setDoc(newSubscriptionRef, newSubscriptionDoc);

    // **Step 7.1-9: No changes beyond adding invoiceId**
    await updateDoc(subscriptionRef, {
      status: 'inactive',
      'dates.endDate': newStartDate,
      'metadata.updatedAt': new Date().toISOString(),
      'metadata.updatedBy': studioId,
    });
    // **Step 8: Manage storage limits for downgrade**
    const isDowngrade = newPlan.pricing[0].storage < currentPlan.pricing[0].storage;
    const usageExceedsLimit = studioData.usage.storage.used > newPlan.pricing[0].storage;
    let storageGracePeriodEnd = null;

    if (isDowngrade && usageExceedsLimit) {
      // Set 30-day grace period
      storageGracePeriodEnd = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const newStorageQuota = newPlan.pricing[0].storage;
    // **Step 9: Update studio document**
    await updateDoc(studioRef, {
      planName: newPlan.name,
      subscriptionId: newSubscriptionId,
      'usage.storage.quota': newStorageQuota, // Update storage quota to new plan's limit
      storageGracePeriodEnd: storageGracePeriodEnd,
      subscriptionHistory: arrayUnion(newSubscriptionId)
    });
    return { success: true, message: 'Subscription changed successfully' };
  } catch (error) {
    console.error('Error changing subscription:', error.message);
    throw error;
  }
}


/**
 * Retrieves the current subscription details for a given studio.
 * @param {string} studioId - The ID of the studio
 * @returns {Promise<{ success: boolean, data: object | null, message: string }>}
 */
export async function getCurrentSubscription(studioId) {
  try {
    const studioRef = doc(db, 'studios', studioId);
    const studioDoc = await getDoc(studioRef);

    if (!studioDoc.exists()) {
      return { success: false, data: null, message: 'Studio not found' };
    }

    const studioData = studioDoc.data();
    const subscriptionId = studioData.subscriptionId;

    if (!subscriptionId) {
      return { success: false, data: null, message: 'No active subscription found for this studio' };
    }

    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      return { success: false, data: null, message: 'Subscription not found in records' };
    }

    const subscriptionData = subscriptionDoc.data();

    // Fetch the linked invoice if it exists
    let invoiceData = null;
    if (subscriptionData.invoiceId) {
      const invoiceRef = doc(db, 'invoices', subscriptionData.invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);
      if (invoiceDoc.exists()) {
        invoiceData = invoiceDoc.data();
      }
    }

    return {
      success: true,
      data: { ...subscriptionData, invoice: invoiceData }, // Include invoice data
      message: 'Subscription retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching subscription:', error.message);
    return { success: false, data: null, message: `Error: ${error.message}` };
  }
}
/**
 * Retrieves all subscriptions for a given studio.
 * @param {string} studioId - The ID of the studio
 * @returns {Promise<{ success: boolean, data: Array<object> | null, message: string }>}
 */
export async function getStudioSubscriptions(studioId) {
  try {
    if (!studioId) {
      return { success: false, data: null, message: 'Studio ID is required' };
    }

    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(subscriptionsRef, where('studioId', '==', studioId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, data: null, message: 'No subscriptions found for this studio' };
    }

    const subscriptions = [];
    for (const doc of querySnapshot.docs) {
      const subscriptionData = doc.data();
      let invoiceData = null;

      // Fetch the linked invoice if it exists
      if (subscriptionData.invoiceId) {
        const invoiceRef = doc(db, 'invoices', subscriptionData.invoiceId);
        const invoiceDoc = await getDoc(invoiceRef);
        if (invoiceDoc.exists()) {
          invoiceData = invoiceDoc.data();
        }
      }

      subscriptions.push({
        id: doc.id,
        ...subscriptionData,
        invoice: invoiceData, // Include invoice data
      });
    }

    return {
      success: true,
      data: subscriptions,
      message: 'Subscriptions retrieved successfully',
    };
  } catch (error) {
    console.error('Error fetching subscriptions:', error.message);
    return { success: false, data: null, message: `Error: ${error.message}` };
  }
}




/**
 * Creates an invoice for a subscription and returns its ID.
 * @param {string} studioId - The ID of the studio
 * @param {string} subscriptionId - The ID of the subscription
 * @param {number} amount - The total amount for the invoice
 * @param {string} billingCycle - The billing cycle (monthly/yearly)
 * @param {string} status - The status of the invoice (e.g., 'pending', 'paid')
 * @returns {Promise<string>} - The ID of the created invoice
 */
export const createInvoice = async (studioId, plan, subscriptionId, amount, billingCycle, status = 'pending') => {
  try {
    const invoiceId = await generateInvoiceId(studioId, plan);
    const invoiceRef = doc(db, 'invoices', invoiceId);

    const invoiceData = {
      // Core Identification
      id: invoiceId,
      studioId: studioId,
      subscriptionId: subscriptionId,

      // Financial Details
      pricing: {
        amount: amount,           // Base amount for the invoice
        currency: 'INR',          // ISO 4217 currency code
        discount: 0,              // Discount applied (future-proofing)
        tax: 0,                   // Tax amount (future-proofing)
        totalAmount: amount,      // Final amount after discount and tax
      },

      // Billing Information
      billing: {
        cycle: billingCycle,      // 'monthly' | 'yearly' | future custom cycles
        period: {
          startDate: new Date().toISOString(), // Start of billing period
          endDate: null,            // End of billing period (null until completed)
        },
      },

      // Payment Details
      payment: {
        status: status,           // 'pending' | 'paid' | 'failed' | 'refunded'
        platform: amount > 0 ? 'razorpay' : null, // Payment gateway or null
        transactionId: null,      // Unique ID from payment platform
        method: null,             // 'upi' | 'credit-card' | 'debit-card' | etc.
        paidAt: null,             // Timestamp of payment completion
      },

      // Plan Reference (Simplified)
      planSnapshot: {
        id: plan.planId || null,  // Reference to plan ID (if available)
        name: plan.name,          // Human-readable plan name
        type: plan.type,          // 'free' | 'paid' | 'enterprise'
      },

      // Metadata
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: studioId,      // Entity responsible for creation
        updatedBy: null,          // Entity responsible for last update
        version: 1,               // For future schema migrations
      },

      // Additional Context (Future-Proofing)
      notes: [],                  // Array of strings for internal notes
      externalReference: null,    // For linking to external systems
    };

    await setDoc(invoiceRef, invoiceData);
    return invoiceId;
  } catch (error) {
    console.error('Error creating invoice:', error.message);
    throw error;
  }
};
/**
 * Generates a unique invoice ID in the format HEX-YYMM-STXXX-SEQ.
 * @param {string} studioId - The ID of the studio
 * @returns {Promise<string>} - The generated invoice ID
 */

async function generateInvoiceId(studioId,newPlan) {
  try {

    // Get current date components
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // YY (e.g., "25")
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM (01-12)

    // Date portion: YYMM
    const dateStr = `${year}${month}`; // e.g., "2503" for March 2025

    // Studio portion: First 2 letters + random 3-character string
    const studioPrefix = studioId.slice(0, 3).toUpperCase(); // e.g., "ST" from "studio123"
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 5-studioPrefix.length; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const studioCode = `${studioPrefix}${randomStr}`; // e.g., "STK9P"
    // planPrefix newPlan.name based Core - CORE , Freelance - FRE , Studio - STU, Companyy - COM
    function getPlanPrefix(planName) {
      const prefixMap = {
          "Core": "CORE",
          "Freelancer": "FLN",
          "Studio": "STD",
          "Company": "COM"
      };
      return prefixMap[planName] || "UNKNOWN"; // Default to UNKNOWN if plan name is not found
  }

    // Base invoice ID without sequence
    const baseInvoiceId = `${getPlanPrefix(newPlan.name)}-${dateStr}-${studioCode}`; // e.g., "HEX-2503-STK9P"

    // Query existing invoices for this studio on this month to determine sequence
    const invoicesRef = collection(db, 'invoices');
    const startOfMonth = `${now.getFullYear()}-${month}-01T00:00:00.000Z`;
    const endOfMonth = `${now.getFullYear()}-${month}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}T23:59:59.999Z`;
    const q = query(
      invoicesRef
    );
    const querySnapshot = await getDocs(q);
    console.log(querySnapshot.size);
    // Calculate sequence number
    const existingInvoices = querySnapshot.size; // Number of invoices this month with this base

    const seqNum = (existingInvoices + 1).toString().padStart(3, '0'); // e.g., "001"

    // Final invoice ID
    const invoiceId = `${baseInvoiceId}-${seqNum}`; // e.g., "HEX-2503-STK9P-001"
    return invoiceId;
  } catch (error) {
    console.error('Error generating invoice ID:', error.message);
    throw error;
  }
}
