import { getStudioAccessState, normalizeEndDateToTimestamp } from './studioAccess';

describe('studioAccess Evaluator', () => {
  const futureDate = '2099-12-31';
  const pastDate = '2020-01-01';

  test('Test A — Valid studio: active studio + active subscription + future endDate', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const subscription = {
      status: 'active',
      dates: { endDate: futureDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'active',
      allowed: true,
      reason: null
    });
  });

  test('Test B — Expired subscription: active studio + active subscription + past endDate', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const subscription = {
      status: 'active',
      dates: { endDate: pastDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'expired',
      allowed: false,
      reason: 'subscription_expired'
    });
  });

  test('Test C — Suspended studio: suspended studio + active subscription + future endDate', () => {
    const studio = { status: 'suspended', domain: 'test-studio' };
    const subscription = {
      status: 'active',
      dates: { endDate: futureDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'suspended',
      allowed: false,
      reason: 'studio_suspended'
    });
  });

  test('Test D — Inactive studio: inactive studio + active subscription + future endDate', () => {
    const studio = { status: 'inactive', domain: 'test-studio' };
    const subscription = {
      status: 'active',
      dates: { endDate: futureDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'inactive',
      allowed: false,
      reason: 'studio_inactive'
    });
  });

  test('Test E — Suspended + expired: manual suspension takes precedence', () => {
    const studio = { status: 'suspended', domain: 'test-studio' };
    const subscription = {
      status: 'active',
      dates: { endDate: pastDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'suspended',
      allowed: false,
      reason: 'studio_suspended'
    });
  });

  test('Test F — No subscription: studio without subscription record', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const access = getStudioAccessState(studio, null);
    expect(access).toEqual({
      state: 'no_subscription',
      allowed: false,
      reason: 'no_subscription'
    });
  });

  test('Test G — Missing endDate: legacy subscription without dates.endDate does not lock out', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const subscription = {
      status: 'active',
      dates: {}
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access.allowed).toBe(true);
    expect(access.state).toBe('active');
    expect(access.reason).toBe('legacy_missing_end_date');
  });

  test('Loading state handling', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const access = getStudioAccessState(studio, null, true);
    expect(access).toEqual({
      state: 'loading',
      allowed: false,
      reason: null
    });
  });

  test('Invalid subscription status (e.g. canceled or inactive)', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const subscription = {
      status: 'cancelled',
      dates: { endDate: futureDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'inactive',
      allowed: false,
      reason: 'subscription_inactive'
    });
  });

  test('Trialing subscription with future endDate is allowed', () => {
    const studio = { status: 'active', domain: 'test-studio' };
    const subscription = {
      status: 'trialing',
      dates: { endDate: futureDate }
    };
    const access = getStudioAccessState(studio, subscription);
    expect(access).toEqual({
      state: 'active',
      allowed: true,
      reason: null
    });
  });

  test('Date normalization: valid through end of day for YYYY-MM-DD', () => {
    const dateStr = '2026-09-28';
    const timestamp = normalizeEndDateToTimestamp(dateStr);
    const endOfDay = new Date(2026, 8, 28, 23, 59, 59, 999).getTime();
    expect(timestamp).toBe(endOfDay);
  });
});
