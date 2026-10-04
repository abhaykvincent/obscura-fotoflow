import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStudio, selectCurrentSubscription } from '../../app/slices/studioSlice';
import { getStudioAccessState } from '../../utils/studioAccess';
import AccessBlocked from './AccessBlocked';

/**
 * StudioAccessGate protects studio workspace routes based on:
 * 1. studio.status (active, inactive, suspended)
 * 2. subscription entitlement & dates.endDate
 *
 * NOTE: Admin routes (/admin/*) and public routes are outside of this gate.
 */
export default function StudioAccessGate({ allowSubscriptionPage = false }) {
  const studio = useSelector(selectStudio);
  const currentSubscription = useSelector(selectCurrentSubscription);
  const studioLoading = useSelector((state) => state.studio?.loading);

  const access = getStudioAccessState(studio, currentSubscription, studioLoading);

  // If access is allowed, render child routes normally
  if (access.allowed) {
    return <Outlet />;
  }

  // Subscription / billing pages must stay visible even when the studio is
  // blocked (expired, no_subscription, suspended, inactive) so the user can
  // renew / view billing. Admin routes (/admin/*, /tools) live outside this
  // gate entirely.
  if (allowSubscriptionPage && access.state !== 'loading') {
    return <Outlet />;
  }

  return <AccessBlocked accessState={access} />;
}
