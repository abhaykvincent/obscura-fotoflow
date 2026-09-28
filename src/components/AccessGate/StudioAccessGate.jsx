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

  // If the studio's subscription is expired or missing, allow them to view the subscription page to renew
  if (allowSubscriptionPage && (access.state === 'expired' || access.state === 'no_subscription')) {
    return <Outlet />;
  }

  return <AccessBlocked accessState={access} />;
}
