import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../../app/slices/authSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import './AccessBlocked.scss';

const ACCESS_MESSAGES = {
  expired: {
    title: 'Subscription Expired',
    message: 'Your FotoFlow subscription has expired. Please renew your subscription to continue using your studio workspace.',
    actionText: 'Renew Subscription',
    showRenew: true,
  },
  suspended: {
    title: 'Studio Workspace Suspended',
    message: 'This studio workspace is currently suspended. Please contact FotoFlow support for assistance.',
    actionText: 'Contact Support',
    showRenew: false,
  },
  inactive: {
    title: 'Studio Workspace Inactive',
    message: 'This studio workspace is currently inactive. Please contact FotoFlow if you need assistance.',
    actionText: 'Contact Support',
    showRenew: false,
  },
  no_subscription: {
    title: 'No Active Subscription',
    message: 'No active subscription was found for this studio workspace. Please choose a subscription plan to continue.',
    actionText: 'Choose a Plan',
    showRenew: true,
  },
  unknown: {
    title: 'Access Restricted',
    message: 'You currently do not have access to this studio workspace. Please contact FotoFlow if you need assistance.',
    actionText: 'Contact Support',
    showRenew: false,
  },
};

export default function AccessBlocked({ accessState }) {
  const dispatch = useDispatch();
  const defaultStudio = useSelector(selectUserStudio);
  const stateKey = accessState?.state || 'unknown';
  const config = ACCESS_MESSAGES[stateKey] || ACCESS_MESSAGES.unknown;

  const handleLogout = () => {
    dispatch(logout());
  };

  const domain = defaultStudio?.domain;

  return (
    <div className="access-blocked-container">
      <div className="access-blocked-card">
        <div className={`status-icon-wrapper ${stateKey}`}>
          <div className="status-badge-indicator" />
        </div>
        <h1 className="access-blocked-title">{config.title}</h1>
        <p className="access-blocked-description">{config.message}</p>

        <div className="access-blocked-actions">
          {config.showRenew && domain && (
            <Link to={`/${domain}/subscription`} className="button primary">
              {config.actionText}
            </Link>
          )}

          {!config.showRenew && (
            <a href="mailto:support@fotoflow.io" className="button primary">
              {config.actionText}
            </a>
          )}

          <button type="button" onClick={handleLogout} className="button secondary">
            Sign Out
          </button>
        </div>

        <div className="access-blocked-footer">
          <span>Need help? Contact </span>
          <a href="mailto:support@fotoflow.io">support@fotoflow.io</a>
        </div>
      </div>
    </div>
  );
}
