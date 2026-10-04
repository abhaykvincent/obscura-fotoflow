import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectStudio, selectCurrentSubscription } from '../../app/slices/studioSlice';
import { getStudioAccessState } from '../../utils/studioAccess';
import { LoadingLight } from '../Loading/Loading';
import AccessBlocked from './AccessBlocked';

/**
 * Paths that must stay visible even when the studio is blocked
 * (expired, no_subscription, suspended, inactive) so the user can
 * renew / view billing / manage settings. Matches:
 * /:studioName/subscription, /:studioName/subscription/history, /:studioName/settings
 */
const EXEMPT_PATH_RE = /\/(subscription(\/history)?|settings)\/?$/;

/**
 * StudioAccessGate protects studio workspace routes based on:
 * 1. studio.status (active, inactive, suspended)
 * 2. subscription entitlement & dates.endDate
 *
 * NOTE: Admin routes (/admin/*) and public routes are outside of this gate.
 * NOTE: Subscription / billing / settings pages are exempt from the access
 * block (same as Admin/Tools) — enforced here by path as well as by the
 * allowSubscriptionPage prop, so placement mistakes can't re-block them.
 */
export default function StudioAccessGate({ allowSubscriptionPage = false }) {
  const location = useLocation();
  const studio = useSelector(selectStudio);
  const currentSubscription = useSelector(selectCurrentSubscription);
  const studioLoading = useSelector((state) => state.studio?.loading);
  const studioError = useSelector((state) => state.studio?.error);

  const access = getStudioAccessState(studio, currentSubscription, studioLoading);

  // Exempt pages (subscription / billing history / settings) are never
  // blocked — not even while studio data is still loading — so suspended /
  // inactive users can always reach them to renew or view billing.
  // Checked by path (not just the prop) so the exemption survives route
  // re-organisation. Admin routes (/admin/*, /tools) live outside this
  // gate entirely.
  if (allowSubscriptionPage || EXEMPT_PATH_RE.test(location.pathname)) {
    return <Outlet />;
  }

  // Studio / subscription data not ready yet: the slice still holds its
  // initial placeholder (null id/domain/status) which the evaluator would
  // misread as a blocked studio. Show a loader — never flash the
  // access-blocked card on placeholder data. (Genuine failures fall through:
  // studioError set, or fetch resolved with no studio record.)
  const isStudioPlaceholder = studio != null && !studio.id && !studio.domain;
  const isSubscriptionPlaceholder =
    currentSubscription != null && !currentSubscription.id && !currentSubscription.status;
  if (
    !studioError &&
    (studioLoading || access.state === 'loading' || isStudioPlaceholder || isSubscriptionPlaceholder)
  ) {
    return <LoadingLight />;
  }

  // If access is allowed, render child routes normally
  if (access.allowed) {
    return <Outlet />;
  }

  return <AccessBlocked accessState={access} />;
}
