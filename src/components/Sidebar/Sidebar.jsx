import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import './Sidebar.scss'
import { GrUpgrade } from "react-icons/gr";
import { logout, selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import AdminRoute from '../AdminRoute/AdminRoute';
import { trackEvent } from '../../analytics/utils';
import { selectCurrentSubscription, selectStudio, selectStudioStorageUsage } from '../../app/slices/studioSlice';
import { convertMegabytes } from '../../utils/stringUtils';
import { getDaysFromNow, getEventTimeAgo } from '../../utils/dateUtils';
import NetworkSignal from '../NetworkSignal/NetworkSignal';

function Sidebar() {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [profileOptionActive, setProfileOptionActive] = useState(false)
  const defaultStudio = useSelector(selectUserStudio)
  const currentSubscription = useSelector(selectCurrentSubscription)
  const location = useLocation();
  const params = useParams()
  const studioName = defaultStudio?.domain ?? {domain:'guest',name:'guest'}; 
  const studio= useSelector(selectStudio)
  const storageLimit = useSelector(selectStudioStorageUsage); // This provides raw usage data

  // State to hold formatted storage usage, though we'll directly use studio?.usage for charts now
  const [storageUsage , setStorageUsage] = useState({})

  const toggleProfileOption = () => {
    setProfileOptionActive((prevState) => !prevState);
  };

  // This useEffect can remain for other parts of the sidebar that might use `storageUsage` state
  useEffect(() => {
    setStorageUsage({
      used: (storageLimit?.used/1000).toFixed(2),
      quota: (storageLimit?.quota/1000).toFixed(0),
      usedPercentage: (storageLimit?.used/storageLimit?.quota*100).toFixed(2)
    })
    },[storageLimit])


  if(user==='no-studio-found')
    return null; // Return null if no studio is found to prevent rendering issues

  const storageUsedMB = studio?.usage?.storage?.used || 0;
  const storageQuotaMB = studio?.usage?.storage?.quota || 0
  const archiveQuotaMB = (studio?.usage?.storage?.quota || 0) * 2; 

  // DEFERRED
  // Calculate percentages. Handle division by zero for quotas.
  const storageUsedPercentage = (storageQuotaMB > 0) ? (storageUsedMB / storageQuotaMB) * 100 : 0;
  // Assuming archive uses the same 'used' value but a different, larger quota
  const archiveUsedPercentage = (archiveQuotaMB > 0) ? (storageUsedMB / archiveQuotaMB) * 100 : 0; 

  return (
    <div className={`sidebar ${location.pathname === `/${studioName}/home` ? 'sleep-sidebar' : 'sleep-sidebar'}`}>

      <div className="menu-list">
        <Link to={`/${studioName}/home`}>
          <div className={`menu home ${location.pathname === `/${studioName}/` || location.pathname === `/${studioName}/home` ? 'active' : ''}`}>
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
        <Link to={`/${studioName}/packages`}>
          <div className={`menu packages ${location.pathname === `/${studioName}/packages` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Packages</div>
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

        {/* 
        <Link to={`/${studioName}/bookings`}>
            <div className={`menu booking ${location.pathname === `/${studioName}/bookings` ? 'active' : ''} disabled`}>
            <div className="icon"></div> <div className="label">Bookings</div>
          </div>
        </Link>
        <Link to={`/${studioName}/calendar`}>
          <div className={`menu calendar ${location.pathname === `/${studioName}/calendar` ? 'active' : ''} disabled`}>
            <div className="icon"></div> <div className="label">Calendar</div>
          </div>
        </Link>
        <Link to={`/${studioName}/store`}>
          <div className={`menu store ${location.pathname === `/${studioName}/store` ? 'active' : ''} disabled`}>
            <div className="icon"></div> <div className="label">Store</div>
          </div>
        </Link> 
        <Link to={`/${studioName}/invoices`}>
          <div className={`menu invoices ${location.pathname === `/${studioName}/invoices` ? 'active' : ''} disabled`}>
            <div className="icon"></div> <div className="label">Financials</div>
          </div>
        </Link> 
        */}



        {/* Admin */}
        
        <p className="label"></p>
        {/* <Link to={`/${studioName}/team`}>
          <div className={`menu team ${location.pathname === `/${studioName}/team` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Team</div>
          </div>
        </Link> */}

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
        <Link to={`/${studioName}/settings`}>
          <div className={`menu settings ${location.pathname === `/${studioName}/settings` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Setting</div>
          </div>
        </Link>
        <Link to={`/${studioName}/subscription`}>
          <div className={`menu subscription ${location.pathname === `/${studioName}/subscription` ? 'active' : ''}`}>
            <div className="icon"></div>
            <div className="label">Pricing </div>
          </div>
        </Link>

        <div className="plan-labels">
          {
            getDaysFromNow(studio?.trialEndDate) < 0 ?
              <div className="expiry-label">{`Trial expired
                ${ Math.abs(getDaysFromNow(studio?.trialEndDate))} days ago`}
              </div>:
              getDaysFromNow(studio?.trialEndDate) === 0?
                <div className="expiry-label">{`Trial ends today`}</div>:
                <div className="expiry-label">
                  {`Trial ends in ${ getDaysFromNow(studio?.trialEndDate)} days`}
                </div>
          }
          <Link  to={`/${studioName}/subscription`}>
          <p className='plan-name'>{`${studio?.planName}  `}
            {
              getDaysFromNow(studio?.trialEndDate) <5?
              <span className='tag free pay-now'>Pay now</span>:
              studio?.planName === 'Studio' ? 
                <span className='tag pro'>Trial</span> : 
                <span className='tag free'>Upgrade</span>
            }

          </p>
          </Link>
        </div>
        <div className="storage-bars">
          
          <div className="storage-bar hot">
            <div className="storage-labels">
              <div className="icon "></div>
              <p>Storage </p><div className="storage-labels used-quota-gb">
              <p className="used-gb">
                {/* {Math.round(storageUsage?.usedPercentage)}%  */}
                <span>{convertMegabytes(studio?.usage?.storage?.used)}</span>  </p>
                <div className="slash">/</div>
              <p className="quota-gb">{convertMegabytes(studio?.usage?.storage?.quota)}</p>
            </div>
              </div>
            <div className="used-bar"
              style={{
                width: `${storageUsage?.usedPercentage}%`
              }}
            ></div>
            <div className="quota-bar"></div>
            
          </div>
          {/* <div className="storage-bar cold">
            <div className="used-bar"
              style={{
                width: `${storageUsage?.usedPercentage}%`
              }}
            ></div>
            <div className="quota-bar"></div>
            <div className="storage-labels">
              <div className="icon "></div>
              <p>Archive</p>

              <div className="storage-labels used-quota-gb">
                <p className="used-gb">
                  {Math.round(storageUsage?.usedPercentage)}%
                  <span>{convertMegabytes(studio?.usage?.storage?.used)} </span>
                </p>
                <div className="slash">/</div>
                <p className="quota-gb">{convertMegabytes(studio?.usage?.storage?.quota*2)}</p>
              </div>
              </div>
          </div> */}
          
        </div>

        {/* <AdminRoute> 
          <p className="label">Product ADMIN</p>
          <Link to={`/admin`}>
            <div className={`menu admin ${location.pathname === `/admin` ? 'selected' : ''}`}>
              <div className="icon"></div>
              <div className="label">Admin</div>
            </div>
          </Link>
        </AdminRoute> */}
        {
          user.email =='abhaykvincent@gmail.com' &&
          <>
          
          <p className="label">Operations</p>
          <Link to={`/admin`}>
            <div className={`menu admin ${location.pathname === `/admin` ? 'selected' : ''}`}>
              <div className="icon"></div>
              <div className="label">Admin</div>
            </div>
          </Link>
          <Link to={`/tools`}>
            <div className={`menu admin ${location.pathname === `/tools` ? 'selected' : ''}`}>
              <div className="icon"></div>
              <div className="label">Tools</div>
            </div>
          </Link>
          </>
        }

      </div>

      <div className="profile-settings">
        <div className={`profile-options  ${profileOptionActive?'active':''}`} onClick={toggleProfileOption}>
          <div className="profile"
          >
            <div className="profile-image"
              style={{
                backgroundImage: `url(${user?.photoURL})`
              }}
            ></div>
            <div className="account-name">
              <div className="studio-name">{user?.displayName}</div>
              <div className="profile-name">
                {/* MArquee one after other in quere repeate */}
                <div className="roles" direction="left" behavior="scroll" scrollamount="2" scrolldelay="2" loop="3" style={{whiteSpace: 'nowrap'}}>
                  <div className="role admin">Admin</div>
                  <div className="role photographer">Photo</div>
                  
                  </div>
                </div>
            </div>
          </div>
          <div className="option-icon"></div>
        </div>
        <div className={`profile-options-window ${profileOptionActive?'active':''}`}>
          
          
          <Link to={`/${defaultStudio?.domain}/notifications`}>
            <div className="option notification">Notifications</div>
          </Link>
          <Link to={`/${defaultStudio?.domain}/subscription`}>
            <div className="option subscription">Subscription</div>
          </Link>
          <Link to={`/${defaultStudio?.domain}/storage`}>
            <div className="option storage">Storage</div>
          </Link>
          <Link to={`/${defaultStudio?.domain}/contact`}>
            <div className="option contact">Contact</div>
          </Link>
          <Link to={`/${defaultStudio?.domain}/settings`}>
            <div className="option settings">Settings</div>
          </Link>
            <div className="seperator"></div>
          <div className="option primary switch"
            onClick={
              ()=>{
                dispatch(logout())
                trackEvent('logout')
                navigate(`/`)
              }
            }
          >Switch Studio</div>
          <div className="option primary logout"
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

      <div className="corner-tools">
        <NetworkSignal />
        <div className="corner-lock" onClick={() => {
          dispatch(logout())
          trackEvent('logout')
          navigate(`/login`)
        }}></div>
        <div className="time-bay"><span>|</span> </div>
        <div className="time-bay">10:23 PM <span>|</span> Sun 16 Jul </div>
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