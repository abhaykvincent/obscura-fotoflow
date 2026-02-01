import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.scss';
import { logout, selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { trackEvent } from '../../analytics/utils';
import { selectCurrentSubscription, selectStudio, selectStudioStorageUsage } from '../../app/slices/studioSlice';
import { convertMegabytes } from '../../utils/stringUtils';
import { getDaysFromNow } from '../../utils/dateUtils';
import NetworkSignal from '../NetworkSignal/NetworkSignal';

function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const location = useLocation();
  const defaultStudio = useSelector(selectUserStudio);
  const studio = useSelector(selectStudio);
  const storageLimit = useSelector(selectStudioStorageUsage);

  const [profileOptionActive, setProfileOptionActive] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0, usedPercentage: 0 });

  const studioName = defaultStudio?.domain || 'guest';

  useEffect(() => {
    if (storageLimit) {
      const used = storageLimit.used / 1000;
      const quota = storageLimit.quota / 1000;
      const usedPercentage = (storageLimit.used / storageLimit.quota) * 100;
      setStorageUsage({
        used: used.toFixed(2),
        quota: quota.toFixed(0),
        usedPercentage: usedPercentage.toFixed(2)
      });
    }
  }, [storageLimit]);

  const toggleProfileOption = (e) => {
    e.stopPropagation();
    setProfileOptionActive(!profileOptionActive);
  };

  const handleLogout = () => {
    dispatch(logout());
    trackEvent('logout');
    navigate('/');
  };

  if (user === 'no-studio-found' || !user) return null;

  const isActive = (path) => {
    if (path === `/${studioName}/home`) {
      return location.pathname === `/${studioName}/` || location.pathname === `/${studioName}/home`;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const trialDays = getDaysFromNow(studio?.trialEndDate);
  const isTrialExpired = trialDays < 0;

  const closeSidebar = () => {
    document.querySelector('.sidebar')?.classList.add('hide');
  };

  return (
    <>
      <div className="sidebar-overlay" onClick={closeSidebar}></div>
      <div className="sidebar sleep-sidebar">
        <div className="menu-list">
          <Link to={`/${studioName}/home`} onClick={closeSidebar}>
            <div className={`menu home ${isActive(`/${studioName}/home`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Home</div>
            </div>
          </Link>
          <Link to={`/${studioName}/projects`} onClick={closeSidebar}>
            <div className={`menu projects ${isActive(`/${studioName}/projects`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Projects</div>
            </div>
          </Link>
          <Link to={`/${studioName}/packages`} onClick={closeSidebar}>
            <div className={`menu packages ${isActive(`/${studioName}/packages`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Packages</div>
            </div>
          </Link>
          
          {process.env.NODE_ENV === 'development' && (
            <Link to={`/${studioName}/portfolio-editor`} onClick={closeSidebar}>
              <div className={`menu portfolio ${isActive(`/${studioName}/portfolio-editor`) ? 'active' : ''}`}>
                <div className="icon"></div>
                <div className="label">Website</div>
              </div>
            </Link>
          )}

          <div className="menu-divider"></div>

          <Link to={`/${studioName}/notifications`} onClick={closeSidebar}>
            <div className={`menu notifications ${isActive(`/${studioName}/notifications`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Notifications</div>
            </div>
          </Link>
          <Link to={`/${studioName}/storage`} onClick={closeSidebar}>
            <div className={`menu storage ${isActive(`/${studioName}/storage`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Storage</div>
            </div>
          </Link>
          <Link to={`/${studioName}/settings`} onClick={closeSidebar}>
            <div className={`menu settings ${isActive(`/${studioName}/settings`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Settings</div>
            </div>
          </Link>
          <Link to={`/${studioName}/subscription`} onClick={closeSidebar}>
            <div className={`menu subscription ${isActive(`/${studioName}/subscription`) ? 'active' : ''}`}>
              <div className="icon"></div>
              <div className="label">Pricing</div>
            </div>
          </Link>

          {user.email === 'abhaykvincent@gmail.com' && (
            <>
              <div className="menu-divider"></div>
              <p className="admin-section-label">Operations</p>
              <Link to={`/admin`} onClick={closeSidebar}>
                <div className={`menu admin ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                  <div className="icon"></div>
                  <div className="label">Admin</div>
                </div>
              </Link>
              <Link to={`/tools`} onClick={closeSidebar}>
                <div className={`menu admin ${location.pathname.startsWith('/tools') ? 'active' : ''}`}>
                  <div className="icon"></div>
                  <div className="label">Tools</div>
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-stats">
            <div className="plan-status">
              <div className="trial-info">
                {isTrialExpired ? (
                  <span className="expiry-text expired">Trial expired {Math.abs(trialDays)}d ago</span>
                ) : trialDays === 0 ? (
                  <span className="expiry-text warning">Trial ends today</span>
                ) : (
                  <span className="expiry-text">Trial ends in {trialDays}d</span>
                )}
              </div>
              <Link to={`/${studioName}/subscription`} className="plan-badge-container" onClick={closeSidebar}>
                <span className="plan-name">{studio?.planName || 'Free'}</span>
                {trialDays < 5 || isTrialExpired ? (
                  <span className="tag pay-now">Pay Now</span>
                ) : studio?.planName === 'Studio' ? (
                  <span className="tag trial">Trial</span>
                ) : (
                  <span className="tag upgrade">Upgrade</span>
                )}
              </Link>
            </div>

            <div className="storage-status">
              <div className="storage-header">
                <div className="storage-title">
                  <div className="icon hot"></div>
                  <span>Storage</span>
                </div>
                <div className="storage-values">
                  <span className="used">{convertMegabytes(studio?.usage?.storage?.used)}</span>
                  <span className="divider">/</span>
                  <span className="quota">{convertMegabytes(studio?.usage?.storage?.quota)}</span>
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${Math.min(100, storageUsage.usedPercentage)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className={`profile-trigger ${profileOptionActive ? 'active' : ''}`} onClick={toggleProfileOption}>
              <div className="profile-info">
                <div className="avatar" style={{ backgroundImage: `url(${user?.photoURL})` }}></div>
                <div className="user-details">
                  <div className="display-name">{user?.displayName}</div>
                  <div className="user-roles">
                    <span className="role admin">Admin</span>
                    <span className="role">Photographer</span>
                  </div>
                </div>
              </div>
              <div className="chevron-icon"></div>
            </div>

            <div className={`profile-menu ${profileOptionActive ? 'active' : ''}`}>
              <Link to={`/${studioName}/settings`} onClick={() => { setProfileOptionActive(false); closeSidebar(); }} className="menu-item settings">Settings</Link>
              <Link to={`/${studioName}/subscription`} onClick={() => { setProfileOptionActive(false); closeSidebar(); }} className="menu-item subscription">Subscription</Link>
              <Link to={`/${studioName}/storage`} onClick={() => { setProfileOptionActive(false); closeSidebar(); }} className="menu-item storage">Storage</Link>
              <div className="menu-separator"></div>
              <div className="menu-item switch" onClick={handleLogout}>Switch Studio</div>
              <div className="menu-item logout" onClick={handleLogout}>Logout</div>
            </div>
          </div>

          <div className="sidebar-footer">
            <NetworkSignal />
            <div className="footer-actions">
              <div className="lock-icon" onClick={() => { handleLogout(); navigate('/login'); }}></div>
              <div className="system-time">
                <span className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="date">{new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;

// Line Complexity  1.4 ->