import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import './Sidebar.scss'
import { GrUpgrade } from "react-icons/gr";
import { logout, selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
function Sidebar() {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [profileOptionActive, setProfileOptionActive] = useState(false)
  const toggleProfileOption = () => {
    setProfileOptionActive(!profileOptionActive)
  }
  const defaultStudio = useSelector(selectUserStudio)
  const location = useLocation();
  const params = useParams()
  const studioName = defaultStudio.domain
  
  return (
    <div className="sidebar">
      <div className="menu-list">
        <Link to={`/${studioName}/`}>
          <div className={`menu home ${location.pathname === `/${studioName}/` ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Home</div>
          </div>
        </Link>
        <Link to={`/${studioName}/projects`}>
          <div className={`menu projects ${location.pathname === `/${studioName}/projects` ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Projects</div>
          </div>
        </Link>
        <Link to={`/${studioName}/store`}>
          <div className={`menu store ${location.pathname === `/${studioName}/store` ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Store</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        <Link to={`/${studioName}/calendar`}>
          <div className={`menu calendar ${location.pathname === `/${studioName}/calendar` ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Calendar</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        <Link to={`/${studioName}/invoices`}>
          <div className={`menu invoices ${location.pathname === `/${studioName}/invoices` ? 'selected' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Financials</div>
            <div className="coming-soon">
              <div className="coming-soon-tag">SOON</div>
            </div>
          </div>
        </Link>
        {/* Admin */}
        <p className="label">ADMIN</p>
        <Link to={`/${studioName}/storage`}>
          <div className={`menu storage ${location.pathname === `/${studioName}/storage` ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Storage</div>
          </div>
        </Link>
        <Link to={`/${studioName}/notifications`}>
          <div className={`menu notifications ${location.pathname === `/${studioName}/notifications` ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Notifications</div>
          </div>
        </Link>
        <Link to={`/${studioName}/subscription`}>
          <div className={`menu subscription ${location.pathname === `/${studioName}/subscription` ? 'selected' : ''}`}>
            <div className="icon"></div>
            <div className="label">Subscription</div>
          </div>
        </Link>
        <Link to={`/${studioName}/team`}>
          <div className={`menu team ${location.pathname === `/${studioName}/team` ? 'selected' : ''}`}>
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
              <div className="studio-name">{defaultStudio.name}</div>
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
            onClick={
              ()=>{
                dispatch(logout())
                // navigate('/')
                navigate(`/`)
              }
            }
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
// Line Complexity  1.4 ->