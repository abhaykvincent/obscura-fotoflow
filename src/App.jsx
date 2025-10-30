import React, { useEffect } from 'react';
import { Navigate, Route, Routes, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HotKeys } from 'react-hotkeys';

// Stylesheets
import './App.scss';

// Redux
import { showAlert } from './app/slices/alertSlice';
import { selectModal } from './app/slices/modalSlice';
import { fetchCurrentSubscription, fetchStudio, selectStudio } from './app/slices/studioSlice';
import { selectIsAuthenticated, selectUser, selectUserStudio, verifyAuth, selectAuthLoading } from './app/slices/authSlice';
import { fetchProjects, selectProjectsStatus } from './app/slices/projectsSlice';

// Features
import Home from './features/Home/Home';
import Project from './features/Project/Project';
import Projects from './features/Projects/Projects';
import Packages from './features/Packages/Packages';
import LoginModal from './features/Login/Login';
import ShareProject from './features/Share/Share';
import Storage from './features/Storage/Storage';
import Galleries from './features/Galleries/Galleries';
import SelectionPIN from './features/Selection/SelectionPIN';
import Selection from './features/Selection/Selection';
import Teams from './features/Teams/Teams';
import Onboarding from './features/Onboarding/v2/Onboarding';
import AdminPanel from './features/AdminPanel/AdminPanel';
import DeveloperTools from './features/AdminPanel/DeveloperTools';
import Notifications from './features/Notifications/Notifications';
import InvitationPage from './features/Invitation/InvitationPage';
import InvitationPreview from './features/Invitation/InvitationPreview';
import PortfolioWebsite from './features/Website/Website';
import Settings from './features/Settings/Settings';
import BillingHistory from './features/BillingHistory/BillingHistory';
import SmartGallery from './features/SmartGallery/SmartGallery';

// Components
import Alert from './components/Alert/Alert';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import SearchResults from './components/Search/SearchResults';
import Subscription from './components/Subscription/Subscription';
import UploadProgress from './components/UploadProgress/UploadProgress';
import Loading, { LoadingLight } from './components/Loading/Loading';
import LoadingScreen from './components/Loading/LoadingScreen';
import CommingSoon from './components/CommingSoon/CommingSoon';
import NotFound from './components/NotFound/NotFound';
import SupportIcon from './components/Modal/SupportIcon/FlowPilot';

// Modal Components
import TrialStatusModal from './components/Modal/TrialEnds/TrialEnds';
import UpgradeModal from './components/Subscription/UpgradeModal';

// Hooks
import { useShortcutsConfig } from './hooks/shortcutsConfig';

// Utils
import { setUserType } from './analytics/utils';
import { isPublicPage, isLightModePage } from './utils/publicPages';
import { getCurrentSubscription } from './firebase/functions/subscription';
import { welcomeConsole } from './utils/welcomeConsole';
import { hideLoading } from './app/slices/loadingSlice';


welcomeConsole();

// Wrapper for authenticated routes
const AuthWrapper = ({ isAuthenticated }) => {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};


// APP
export default function App() {
  const dispatch = useDispatch();
 
  const user = useSelector(selectUser);
  const authLoading = useSelector(selectAuthLoading);

  const isLoading = useSelector(selectProjectsStatus);
  const defaultStudio = useSelector(selectUserStudio)
  const studio = useSelector(selectStudio);

  const modals = useSelector(selectModal);
  const currentDomain = defaultStudio?.domain ?? 'guest'; 
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { keyMap, handlers } = useShortcutsConfig();

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  useEffect(() => {
    if(isAuthenticated && user!=='no-studio-found'){
      console.log(`%cUser authenticated as ${user.email} | Studio: ${defaultStudio?.domain}`, `color: green`);
      setUserType('Photographer');
    }
  }, [isAuthenticated, user, defaultStudio]);

  // ON Render
  useEffect(() => {
    if (isAuthenticated && currentDomain !== 'guest') {
      // Fetching data for studio
      console.log(`%cFetching data for ${currentDomain}...`,`color: gray`)
      dispatch(fetchProjects({currentDomain}))
      .catch((err)=>{
        dispatch(showAlert({ type: 'error', message: 'Check internet connection' }));
      })

      dispatch(fetchStudio({currentDomain})).then((a) => {

        dispatch(fetchCurrentSubscription({currentDomain}))
        .catch((err)=>{
          console.error(err)
        })

      })
      .catch((err)=>{
        console.error(err)
      })
    }
  }, [dispatch, currentDomain, isAuthenticated]);

  useEffect(() =>{
    if (studio?.trialEndDate) {
      const trialDaysLeft = Math.ceil((new Date(studio.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Trial ends on ${studio?.trialEndDate}, in ${trialDaysLeft} days`)
    }
  },[studio?.trialEndDate])

  useEffect(() => {
    const modalStates = Object.values(modals);
    if (modalStates.some(state => state)) {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
    } 
    else {
      document.body.style.overflow = 'auto';
    }
  }, [modals]);

  useEffect(() => {
    if(defaultStudio?.domain){
        getCurrentSubscription(defaultStudio.domain)
    }
  }, [defaultStudio]);

  if (authLoading) {
    return <LoadingLight />;
  }
  dispatch(hideLoading())
  // RENDER
  return (
    <div className={`App ${isLightModePage() && 'light-mode-page'}`}>
      <LoadingScreen />
      <HotKeys keyMap={keyMap} handlers={handlers} className='app-wrap'>
      {/* <SupportIcon userId={defaultStudio?.domain}/> */}
      {isAuthenticated && (!isPublicPage()) && (
        <>
          <Header />
          <Sidebar />
          <Alert />
          <UploadProgress/>
          <UpgradeModal/>
          <TrialStatusModal/>
        </>
      )}
      {
        isLoading!== 'succeeded' && isAuthenticated && user!=='no-studio-found'  ? 
          (
            isLoading!=='login' && (!isPublicPage()) ?  <Loading/> : <LoadingLight/>
          ) : 
          (
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginModal />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/:studioName/smart-gallery/:projectId/:collectionId?" element={<SmartGallery/>}/>
              <Route path="/:studioName/share/:projectId/:collectionId?" element={<ShareProject/>}/>
              <Route path="/:studioName/selection/:projectId/pin" element={<SelectionPIN/>}/>
              <Route path="/:studioName/selection/:projectId/:collectionId?" element={<Selection/>}/>
              <Route path="/:studioName/invitation/:projectId/:eventId?" element={<InvitationPreview/>}/>

              {/* Authenticated Routes */}
              <Route element={<AuthWrapper isAuthenticated={isAuthenticated} />}>
                <Route path="/" element={<Navigate to={`/${defaultStudio.domain}/home`} replace />} />
                <Route path="/search" element={<SearchResults />} />
                
                <Route path="/:studioName" element={<Navigate to={`/${defaultStudio.domain}/home`} replace />} />
                <Route path="/:studioName/home" element={<Home />} />
                <Route path="/:studioName/project/:id" element={<Project />} />
                <Route path="/:studioName/gallery/:id/:collectionId?" element={<Galleries />} />
                <Route path="/:studioName/portfolio-editor" element={<PortfolioWebsite />} />
                <Route path="/:studioName/invitation-creator/:projectId" element={<InvitationPage/>} />
                <Route path="/:studioName/projects" element={<Projects />} />
                <Route path="/:studioName/packages" element={<Packages />} />
                <Route path="/:studioName/settings" element={<Settings/>} />
                <Route path="/:studioName/notifications" element={<Notifications />} />
                <Route path="/:studioName/storage" element={<Storage />} />
                <Route path="/:studioName/subscription/history" element={<BillingHistory />} />
                <Route path="/:studioName/subscription" element={<Subscription />} />
                <Route path="/:studioName/store" element={<CommingSoon title={'Store'}/>} />
                <Route path="/:studioName/calendar" element={<CommingSoon title={'Calendar'}/>} />
                <Route path="/:studioName/invoices" element={<CommingSoon title={'Financials'}/>} />
                <Route path="/:studioName/accounts" element={<CommingSoon title={'Accounts'}/>} />
                <Route path="/:studioName/team" element={<Teams />} />

                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/admin/:page" element={<AdminPanel />} />
                <Route path="/tools" element={<DeveloperTools />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          )}

{!isLightModePage&&<div className="footer">
            {/* Made in Kochi by Photographers |  */}
            <div className='copyright-symbol'>©</div>  
            <a href="https://www.masanory.com" target="_blank" rel="noopener noreferrer"><span>Fotoflow</span> 2025</a>
          </div>}
          </HotKeys>
          
    </div>
    
  );
}