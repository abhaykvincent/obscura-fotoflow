/**
 * Normalize different date representations to a timestamp (milliseconds).
 * Handles:
 * - Firestore Timestamp object (with .toDate() or .seconds)
 * - ISO date strings / date strings
 * - Numbers (timestamp in ms)
 * - Date instances
 *
 * If the string format is YYYY-MM-DD without time, FotoFlow subscriptions treat the date
 * as valid through the end of that day (23:59:59.999).
 *
 * @param {any} dateValue
 * @returns {number|null} timestamp in ms or null if invalid/missing
 */
export function normalizeEndDateToTimestamp(dateValue) {
  if (!dateValue) return null;

  // Firestore Timestamp with toDate()
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate().getTime();
  }

  // Firestore Timestamp object serialized { seconds, nanoseconds }
  if (typeof dateValue.seconds === 'number') {
    return dateValue.seconds * 1000 + Math.floor((dateValue.nanoseconds || 0) / 1e6);
  }

  // Date instance
  if (dateValue instanceof Date) {
    const time = dateValue.getTime();
    return isNaN(time) ? null : time;
  }

  // Number (epoch ms)
  if (typeof dateValue === 'number') {
    return isNaN(dateValue) ? null : dateValue;
  }

  // String date format
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (!trimmed) return null;

    // Check if it's purely YYYY-MM-DD
    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (ymdMatch) {
      const [_, year, month, day] = ymdMatch;
      // Valid through end of day in local/billing context
      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
      const time = parsedDate.getTime();
      return isNaN(time) ? null : time;
    }

    const parsed = new Date(trimmed);
    const time = parsed.getTime();
    return isNaN(time) ? null : time;
  }

  return null;
}

export const VALID_STUDIO_STATUSES = ['active', 'inactive', 'suspended'];

/**
 * Pure evaluator for studio workspace access.
 *
 * Precedence:
 * 1. Loading: If studio is loading, or studio exists and subscription is loading
 * 2. No studio: 'unknown' (or blocked)
 * 3. studio.status === 'suspended': 'suspended'
 * 4. studio.status === 'inactive': 'inactive'
 * 5. No subscription: 'no_subscription'
 * 6. Subscription status invalid (not active / trialing): 'inactive'
 * 7. Subscription endDate missing: legacy/unknown handling -> DO NOT automatically block existing studios ('active' / allowed with reason 'missing_end_date')
 * 8. Subscription endDate has passed: 'expired'
 * 9. Subscription is active/trial and endDate is valid: 'active'
 *
 * @param {object|null} studio - The studio object
 * @param {object|null} subscription - The subscription object
 * @param {boolean} isLoading - Whether studio or subscription is currently loading
 * @param {number|Date} [nowTime=Date.now()] - Current time for testing
 * @returns {{ state: string, allowed: boolean, reason: string|null }}
 */
export function getStudioAccessState(studio, subscription, isLoading = false, nowTime = Date.now()) {
  if (isLoading) {
    return {
      state: 'loading',
      allowed: false,
      reason: null,
    };
  }

  if (!studio) {
    return {
      state: 'unknown',
      allowed: false,
      reason: 'no_studio',
    };
  }

  const studioStatus = (studio.status || 'active').toLowerCase();

  // Explicit administrative blocks take highest precedence
  if (studioStatus === 'suspended') {
    return {
      state: 'suspended',
      allowed: false,
      reason: 'studio_suspended',
    };
  }

  if (studioStatus === 'inactive') {
    return {
      state: 'inactive',
      allowed: false,
      reason: 'studio_inactive',
    };
  }

  // Check subscription entitlement
  if (!subscription) {
    // If studio has no subscriptionId or record
    return {
      state: 'no_subscription',
      allowed: false,
      reason: 'no_subscription',
    };
  }

  const subStatus = (subscription.status || '').toLowerCase();
  // Valid active subscription statuses
  const isValidSubStatus = subStatus === 'active' || subStatus === 'trialing' || subStatus === 'trial';
  if (!isValidSubStatus) {
    return {
      state: 'inactive',
      allowed: false,
      reason: 'subscription_inactive',
    };
  }

  // Authoritative expiry check: subscription.dates.endDate
  const endDateRaw = subscription.dates?.endDate;
  const endTimestamp = normalizeEndDateToTimestamp(endDateRaw);

  if (endTimestamp === null) {
    // P0 Safety Rule: Missing endDate must NOT automatically lock out legacy studios.
    return {
      state: 'active',
      allowed: true,
      reason: 'legacy_missing_end_date',
    };
  }

  const currentTimeMs = nowTime instanceof Date ? nowTime.getTime() : Number(nowTime);

  if (currentTimeMs > endTimestamp) {
    return {
      state: 'expired',
      allowed: false,
      reason: 'subscription_expired',
    };
  }

  return {
    state: 'active',
    allowed: true,
    reason: null,
  };
}
