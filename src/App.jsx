import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HotKeys } from 'react-hotkeys';
// Components
import Alert from './components/Alert/Alert';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import UploadProgress from './components/UploadProgress/UploadProgress';
import Subscription from './components/Subscription/Subscription';
import AddProjectModal from './components/Modal/AddProject';
import Loading from './components/Loading/Loading';
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
import { checkAuthStatus, checkStudioStatus, selectIsAuthenticated, selectUserStudio } from './app/slices/authSlice';
import { selectLoading ,fetchProjects} from './app/slices/projectsSlice';
// Stylesheets
import './App.scss';
import Teams from './features/Teams/Teams';
import SupportIcon from './components/Modal/SupportIcon/SupportIcon';
import { useShortcutsConfig } from './hooks/shortcutsConfig';
import { selectStudio, setStudio } from './app/slices/studioSlice';
import Onboarding from './features/Onboarding/Onboarding';
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
  const isLoading = useSelector(selectLoading);
  const defaultStudio = useSelector(selectUserStudio)
  const url = window.location.href;
  const parts = url.split('/');
  const URLdomain = parts[3];
  const currentDomain = defaultStudio.domain ? defaultStudio.domain : URLdomain;

  let {name,domain} = defaultStudio
  // ON Render
  useEffect(() => {
    console.log("Users Studio : "+defaultStudio.domain)
    console.log('isAuthenticated: '+isAuthenticated)
  }, [isAuthenticated,defaultStudio]);
  // ON Render
  useEffect(() => {
    document.title = `Obscura FotoFlow`;
    dispatch(checkAuthStatus())
    dispatch(checkStudioStatus())
    console.log(currentDomain)
    dispatch(fetchProjects({currentDomain}))
  }, []);
  useEffect(() => {
    document.title = `Obscura FotoFlow`;
    dispatch(checkAuthStatus())
    dispatch(checkStudioStatus())
    console.log(currentDomain)
    dispatch(fetchProjects({currentDomain}))
  }, [currentDomain]);
  const params = useParams()


  // RENDER
  return (
    <div className="App">
      <HotKeys keyMap={keyMap} handlers={handlers}>
      <SupportIcon/>
      {isAuthenticated && (!isPublicPage())? (
        <>
          <Header />
          <Sidebar />
          <Alert />
          <UploadProgress/>
          <AddProjectModal />
        </>
      ) : 
      (<>{ !isPublicPage() && <LoginModal/> }</>)}
      {
        isLoading ? (
          <Loading/>
        ) : (
          <Routes>
            {isAuthenticated && (
            <>
              {/* New dynamic routes */}
              <Route exact path="/" element={<Navigate to={`/${defaultStudio.domain}`} replace />} />
              <Route exact path="/:studioName/" element={<Home />} />
              <Route path="/:studioName/project/:id" element={<Project />} />
              <Route exact path="/:studioName/gallery/:id/:collectionId?" element={<Galleries />} />
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

            <Route path="/share/:projectId/:collectionId?" element={<ShareProject/>}/>
            <Route path="/selection/:projectId/:collectionId?" element={<Selection/>}/>
            <Route path="/masanory-grid" element={<ImageGallery />}/>
          </Routes>
        )}
        </HotKeys>
    </div>
    
  );
}
// Line Complexity  1.5 -> 2.0 -> 2.5 -> 2.0 -> 1.0 ->0.9   -> 1.1