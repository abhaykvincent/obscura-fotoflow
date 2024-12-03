import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HotKeys } from 'react-hotkeys';
import { Client } from 'appwrite';
// Components
import Alert from './components/Alert/Alert';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import UploadProgress from './components/UploadProgress/UploadProgress';
import Subscription from './components/Subscription/Subscription';
import AddProjectModal from './components/Modal/AddProject';
import Loading, { LoadingLight } from './components/Loading/Loading';
// Features
import Home from './features/Home/Home';
import Project from './features/Project/Project';
import Projects from './features/Projects/Projects';
import LoginModal from './features/Login/Login';
import ShareProject from './features/Share/Share';
import Storage from './features/Storage/Storage';
import Galleries from './features/Galleries/Galleries';
import ImageGallery from './x-draft/masanory-grid';
import Selection from './features/Selection/Selection';
import Notifications from './features/Notifications/Notifications';
import CommingSoon from './components/CommingSoon/CommingSoon';
// Utils
import { isPublicPage } from './utils/publicPages';
// Redux 
import { checkAuthStatus, checkStudioStatus, selectIsAuthenticated, selectUser, selectUserStudio } from './app/slices/authSlice';
import { selectLoading ,fetchProjects, selectProjects, selectProjectsStatus, checkFirestoreConnection} from './app/slices/projectsSlice';
// Stylesheets
import './App.scss';
import Teams from './features/Teams/Teams';
import SupportIcon from './components/Modal/SupportIcon/SupportIcon';
import { useShortcutsConfig } from './hooks/shortcutsConfig';
import { selectStudio, setStudio } from './app/slices/studioSlice';
import Onboarding from './features/Onboarding/Onboarding';
import AdminPanel from './features/AdminPanel/AdminPanel';
import useAdminAuth from './hooks/useAdminAuth';
import { selectModal } from './app/slices/modalSlice';
import InvitationPage from './features/Invitation/InvitationPage';
import Preview from './features/Preview/Preview';
import InvitationPreview from './features/Invitation/InvitationPreview';
import { Toaster } from 'sonner';
import { setUserType } from './analytics/utils';
import SearchResults from './components/Search/SearchResults';
import PortfolioWebsite from './features/Website/Website';
import { showAlert } from './app/slices/alertSlice';
const client = new Client();
client.setProject('fotoflow-notifications');

//import AdminRoute from './components/AdminRoute/AdminRoute';
// Wrapper component to pass studio name to pages
const StudioWrapper = ({ Component }) => {
  const { studioName } = useParams();
  return <Component studioName={studioName} />;
};
// APP
export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { keyMap, handlers } = useShortcutsConfig();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectProjectsStatus);
  const projects = useSelector(selectProjects);
  const defaultStudio = useSelector(selectUserStudio)
  const currentDomain = defaultStudio?.domain ?? 'guest'; 
  useEffect(() => {
    if(isAuthenticated && user!=='no-studio-found'){
      setUserType('Photographer');
    }
  }, [isAuthenticated]);
 
  // ON Render
  useEffect(() => {
    dispatch(checkAuthStatus())
    dispatch(checkStudioStatus())
    currentDomain !== 'guest' && dispatch(fetchProjects({currentDomain})).then((res)=>{
      console.log(res)
    })
    .catch((err)=>{
      dispatch(showAlert({ type: 'error', message: 'Check internet connection' }));
    })

  }, [currentDomain]);

  useEffect(() => {
    const modalStates = Object.values(selectModal);
    if (modalStates.some(state => state)) {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectModal]);


  // RENDER
  return (
    <div className="App">
      <HotKeys keyMap={keyMap} handlers={handlers}>
      {/* <SupportIcon/> */}
      {isAuthenticated && user!=='no-studio-found' && (!isPublicPage())? (
        <>
          <Header />
          <Sidebar />
          <Alert />
          <UploadProgress/>
        </>
      ) : 
      (<>{ !isPublicPage() && <LoginModal/> }</>)}
      {
        isLoading!== 'succeeded' && isAuthenticated  ? (
           (!isPublicPage()) ?  <Loading/> : <LoadingLight/>
        ) : (
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
              <Route exact path="/:studioName" element={<Navigate to={`/${defaultStudio.domain}/home`} replace />} />
              <Route path="/search" element={<SearchResults />} />
              <Route exact path="/:studioName/portfolio-editor" element={<PortfolioWebsite />} />
              <Route exact path="/:studioName/home" element={<Home />} />
              <Route exact path="/:studioName/project/:id" element={<Project />} />
              <Route exact path="/:studioName/gallery/:id/:collectionId?" element={<Galleries />} />
              <Route exact path="/:studioName/invitation-creator/:projectId" element={<InvitationPage/>} />
              <Route path="/:studioName/projects" element={<Projects />} />
              <Route path="/:studioName/storage" element={<Storage />} />
              <Route path="/:studioName/notifications" element={<Notifications />} />
              <Route path="/:studioName/subscription" element={<Subscription />} />
              <Route path="/:studioName/store" element={<CommingSoon title={'Store'}/>} />
              <Route path="/:studioName/calendar" element={<CommingSoon title={'Calendar'}/>} />
              <Route path="/:studioName/invoices" element={<CommingSoon title={'Financials'}/>} />
              <Route path="/:studioName/accounts" element={<CommingSoon title={'Accounts'}/>} />
              <Route path="/:studioName/team" element={<Teams />} />

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
// Line Complexity  1.5 -> 2.5 -> 2.0 -> 1.0 ->0.9   -> 1.1 -> 1.2