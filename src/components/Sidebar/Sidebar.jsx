import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.scss'
import { GrUpgrade } from "react-icons/gr";
import { logout, selectUser } from '../../app/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
function Sidebar() {
  
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [profileOptionActive, setProfileOptionActive] = useState(false)
  const toggleProfileOption = () => {
    setProfileOptionActive(!profileOptionActive)
  }
  useEffect(() => {
    // console.log(profileOptionActive)
  }, [profileOptionActive])
  const location = useLocation();
  
  return (
    <div className="sidebar">
      <div className="menu-list">
        <Link to={`/`}>
          <div className={`menu home ${location.pathname === '/' ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Home</div>
          </div>
        </Link>
        <Link to={`/projects`}>
          <div className={`menu projects ${location.pathname === '/projects' ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Projects</div>
          </div>
        </Link>
        <Link to={`/store`}>
          <div className={`menu store ${location.pathname === '/store' ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Store</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        <Link to={`/calendar`}>
          <div className={`menu calendar ${location.pathname === '/calendar' ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Calendar</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        <Link to={`/invoices`}>
          <div className={`menu invoices ${location.pathname === '/invoices' ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Invoices</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        {/* Admin */}
        <p className="label">ADMIN</p>
        <Link to={`/storage`}>
          <div className={`menu storage ${location.pathname === '/storage' ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Storage</div>
          </div>
        </Link>
        <Link to={`/notifications`}>
          <div className={`menu storage ${location.pathname === '/notifications' ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Notifications</div>
          </div>
        </Link>
        <Link to={`/financials`}>
          <div className={`menu accounts ${location.pathname === '/accounts' ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Accounts</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        <Link to={`/team`}>
          <div className={`menu team ${location.pathname === '/team' ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Team</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="profile-settings">
        <div className="profile-options" onClick={toggleProfileOption}>
          <div className="profile"
          >
            <div className="profile-image"></div>
            <div className="account-name">
              <div className="studio-name">Obscura</div>
              <div className="profile-name">{user.displayName}</div>
            </div>
          </div>
          <div className="option-icon"></div>
        </div>
        <div className={`profile-options-window ${profileOptionActive?'active':''}`}>
          <div className="option disabled">Profile</div>
          <div className="option disabled">Account</div>
          <div className="option disabled">Settings</div>
          
          <Link to={`/subscription`}>
            <div className="option">Subscription</div>
          </Link>
          <div className="option logout"
            onClick={()=>dispatch(logout())}
          >Logout</div>
        </div>
      </div>
      <div className="subscriptoion status">
        <div className="icon">
        <GrUpgrade />
        </div>
        <div className="message">Upgrade to <span>STUDIO</span></div>
        <div className="button primary outline"
          
        >Waitlist</div>
        <p className="plan">Current Plan: Freelancer</p>
      </div>
    </div>
  );
}

export default Sidebar;
