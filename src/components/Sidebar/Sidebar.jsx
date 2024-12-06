import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import './Sidebar.scss'
import { GrUpgrade } from "react-icons/gr";
import { logout, selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import AdminRoute from '../AdminRoute/AdminRoute';
import { trackEvent } from '../../analytics/utils';
function Sidebar() {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [profileOptionActive, setProfileOptionActive] = useState(false)
  const toggleProfileOption = () => {
    setProfileOptionActive((prevState) => !prevState);
  };
  const defaultStudio = useSelector(selectUserStudio)
  const location = useLocation();
  const params = useParams()
  const studioName = defaultStudio?.domain ?? {domain:'guest',name:'guest'}; 
  
  if(user==='no-studio-found')
    return 
  return (
    <div className="sidebar">
      <div className="menu-list">
        <Link to={`/${studioName}/home`}>
          <div className={`menu home ${location.pathname === `/${studioName}/` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Home</div>
          </div>
        </Link>
        <Link to={`/${studioName}/projects`}>
          <div className={`menu projects ${location.pathname === `/${studioName}/projects` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Projects</div>
          </div>
        </Link>
        {
          // only on developement
          process.env.NODE_ENV === 'development' &&
        <Link to={`/${studioName}/portfolio-editor`}>
          <div className={`menu portfolio ${location.pathname === `/${studioName}/portfolio-editor` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Website</div>
          </div>
        </Link>

}
        <Link to={`/${studioName}/bookings`}>
          <div className={`menu booking ${location.pathname === `/${studioName}/bookings` ? 'active' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Bookings</div>
          </div>
        </Link>
        <Link to={`/${studioName}/calendar`}>
          <div className={`menu calendar ${location.pathname === `/${studioName}/calendar` ? 'active' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Calendar</div>
          </div>
        </Link>
        <Link to={`/${studioName}/store`}>
          <div className={`menu store ${location.pathname === `/${studioName}/store` ? 'active' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Store</div>
          </div>
        </Link>
        {/* <Link to={`/${studioName}/invoices`}>
          <div className={`menu invoices ${location.pathname === `/${studioName}/invoices` ? 'active' : ''} disabled`}>
            <div className="icon"></div>
            <div className="label">Financials</div>
          </div>
        </Link> */}
        {/* Admin */}
        <p className="label">ADMIN</p>

        <Link to={`/${studioName}/settings`}>
          <div className={`menu settings ${location.pathname === `/${studioName}/settings` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Setting</div>
          </div>
        </Link>
        <Link to={`/${studioName}/team`}>
          <div className={`menu team ${location.pathname === `/${studioName}/team` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Team</div>
          </div>
        </Link>

        <Link to={`/${studioName}/notifications`}>
          <div className={`menu notifications  ${location.pathname === `/${studioName}/notifications` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Notifications</div>
          </div>
        </Link>
        <Link to={`/${studioName}/storage`}>
          <div className={`menu storage ${location.pathname === `/${studioName}/storage` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Storage</div>
          </div>
        </Link>
        <Link to={`/${studioName}/subscription`}>
          <div className={`menu subscription ${location.pathname === `/${studioName}/subscription` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Subscription</div>
          </div>
        </Link>

        {/* <AdminRoute> 
          <p className="label">Product ADMIN</p>
          <Link to={`/admin`}>
            <div className={`menu admin ${location.pathname === `/admin` ? 'selected' : ''}`}>
              <div className="icon"></div>
              <div className="label">Admin</div>
            </div>
          </Link>
        </AdminRoute> */}

      </div>

      <div className="profile-settings">
        <div className={`profile-options  ${profileOptionActive?'active':''}`} onClick={toggleProfileOption}>
          <div className="profile"
          >
            <div className="profile-image"></div>
            <div className="account-name">
              <div className="studio-name">{defaultStudio?.name}</div>
              <div className="profile-name">{user?.displayName} 
                {/* MArquee one after other in quere repeate */}
                <div className="roles" direction="left" behavior="scroll" scrollamount="2" scrolldelay="2" loop="3" style={{whiteSpace: 'nowrap'}}>
                  {user.studio?.roles[0] && <div className="role ">{user.studio?.roles[0]}</div>}
                  <div className="role">Photographer</div>
                  
                  </div>
                </div>
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

      trackEvent('logout')
                // navigate('/')
                navigate(`/`)
              }
            }
          >Logout</div>
        </div>
      </div>
      {/* <div className="subscriptoion status">
        <div className="icon">
        <GrUpgrade />
        </div>
        <div className="message">Upgrade to <span>STUDIO</span></div>
        <div className="button primary outline"
          
        >Upgrade</div>
        <p className="plan">Current Plan: Core</p>
      </div> */}
    </div>
  );
}

export default Sidebar;
// Line Complexity  1.4 ->