import React, { useEffect } from 'react';
import { Navigate, Route, Routes} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HotKeys } from 'react-hotkeys';
// Stylesheets
import './App.scss';
// Features
import Home from './features/Home/Home';
import Project from './features/Project/Project';
import Projects from './features/Projects/Projects';
import LoginModal from './features/Login/Login';
import ShareProject from './features/Share/Share';
import Storage from './features/Storage/Storage';
import Galleries from './features/Galleries/Galleries';
import Selection from './features/Selection/Selection';
import Teams from './features/Teams/Teams';
import ImageGallery from './x-draft/masanory-grid';
import Onboarding from './features/Onboarding/Onboarding';
import AdminPanel from './features/AdminPanel/AdminPanel';
import Notifications from './features/Notifications/Notifications';
import CommingSoon from './components/CommingSoon/CommingSoon';
import InvitationPage from './features/Invitation/InvitationPage';
import InvitationPreview from './features/Invitation/InvitationPreview';
import PortfolioWebsite from './features/Website/Website';
// Components
import Alert from './components/Alert/Alert';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import SearchResults from './components/Search/SearchResults';
import Subscription from './components/Subscription/Subscription';
import UploadProgress from './components/UploadProgress/UploadProgress';
import Loading, { LoadingLight } from './components/Loading/Loading';
import SupportIcon from './components/Modal/SupportIcon/FlowPilot';
// Utils
import { isDeveloper, setUserType } from './analytics/utils';
import { isPublicPage } from './utils/publicPages';
// Redux 
import { showAlert } from './app/slices/alertSlice';
import { selectModal } from './app/slices/modalSlice';
import { fetchStudio} from './app/slices/studioSlice';
import { checkAuthStatus, checkStudioStatus, selectIsAuthenticated, selectUser, selectUserStudio } from './app/slices/authSlice';
import { fetchProjects, selectProjectsStatus} from './app/slices/projectsSlice';
// Hooks
import { useShortcutsConfig } from './hooks/shortcutsConfig';
import useAdminAuth from './hooks/useAdminAuth';
import Settings from './features/Settings/Settings';
import UpgradeModal from './components/Subscription/UpgradeModal';
import { generateReferral } from './app/slices/referralsSlice';
import FlowPilot from './components/Modal/SupportIcon/FlowPilot';


if(isDeveloper) console.log(`%c This device is not being tracked by Analytics in production.`, `color: #ff9500; `);
// APP
export default function App() {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const isLoading = useSelector(selectProjectsStatus);
  const defaultStudio = useSelector(selectUserStudio)
  const currentDomain = defaultStudio?.domain ?? 'guest'; 
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { keyMap, handlers } = useShortcutsConfig();
  useEffect(() => {
    if(isAuthenticated && user!=='no-studio-found'){
      setUserType('Photographer');
    }
  }, [isAuthenticated]);
 
  // ON Render
  useEffect(() => {
    // Check studio status
    dispatch(checkAuthStatus())
    dispatch(checkStudioStatus())

    if(currentDomain !== 'guest')
    {
      // Fetch studio data
      dispatch(fetchProjects({currentDomain}))
      .catch((err)=>{
        dispatch(showAlert({ type: 'error', message: 'Check internet connection' }));
      })
      dispatch(fetchStudio({currentDomain}))
      .catch((err)=>{
        console.error(err)
      })
    }

  }, [currentDomain]);

  useEffect(() => {
    const modalStates = Object.values(selectModal);
    if (modalStates.some(state => state)) {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
    } 
    else {
      document.body.style.overflow = 'auto';
    }
  }, [selectModal]);
  useEffect(() => {
    
          
  }, []);




  // RENDER
  return (
    <div className="App">
      <HotKeys keyMap={keyMap} handlers={handlers}>
      <FlowPilot userId={defaultStudio?.domain}/>
      {isAuthenticated && (!isPublicPage())? (
        <>
          <Header />
          <Sidebar />
          <Alert />
          <UploadProgress/>
          <UpgradeModal/>

        </>
      ) : 
      (<>{ !isPublicPage() && <LoginModal/> }</>)}
      {
        isLoading!== 'succeeded' && isAuthenticated && user!=='no-studio-found'  ? 
          (
            isLoading!=='login' && (!isPublicPage()) ?  <Loading/> : <LoadingLight/>
          ) : 
          (
            <Routes>
              {isAuthenticated && (
                
                <>
                  {/* <Route path="/admin/" element={
                    <AdminRoute> 
                      <AdminPanel /> 
                    </AdminRoute> 
                  }/> */}
                  <Route path="/masanory-grid" element={<ImageGallery  />} />
                    
                  <Route exact path="/" element={<Navigate to={`/${defaultStudio.domain}/home`} replace />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route exact path="/:studioName" element={<Navigate to={`/${defaultStudio.domain}/home`} replace />} />
                  <Route exact path="/:studioName/home" element={<Home />} />
                  <Route exact path="/:studioName/project/:id" element={<Project />} />
                  <Route exact path="/:studioName/gallery/:id/:collectionId?" element={<Galleries />} />
                  <Route exact path="/:studioName/portfolio-editor" element={<PortfolioWebsite />} />
                  <Route exact path="/:studioName/invitation-creator/:projectId" element={<InvitationPage/>} />
                  <Route path="/:studioName/projects" element={<Projects />} />
                  <Route path="/:studioName/settings" element={<Settings/>} />
                  <Route path="/:studioName/notifications" element={<Notifications />} />
                  <Route path="/:studioName/storage" element={<Storage />} />
                  <Route path="/:studioName/subscription" element={<Subscription />} />
                  <Route path="/:studioName/store" element={<CommingSoon title={'Store'}/>} />
                  <Route path="/:studioName/calendar" element={<CommingSoon title={'Calendar'}/>} />
                  <Route path="/:studioName/invoices" element={<CommingSoon title={'Financials'}/>} />
                  <Route path="/:studioName/accounts" element={<CommingSoon title={'Accounts'}/>} />
                  <Route path="/:studioName/team" element={<Teams />} />

                  <Route exact path="/admin" element={<AdminPanel />} />
                  <Route exact path="/admin/:page" element={<AdminPanel />} />
                </>
              
              )}
              <Route path="/onboarding" element={<Onboarding />} />

              <Route path="/:studioName/share/:projectId/:collectionId?" element={<ShareProject/>}/>
              <Route path="/:studioName/selection/:projectId/:collectionId?" element={<Selection/>}/>
              <Route path="/:studioName/invitation/:projectId/:eventId?" element={<InvitationPreview/>}/>
            </Routes>
          )}
          </HotKeys>

    </div>
    
  );
}
// Line Complexity   1.5 -> 2.5   -> 2.0 -> 1.0 -> 0.9    -> 1.1 -> 1.2    -> 1.7