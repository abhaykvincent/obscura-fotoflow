import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import { checkAuthStatus, selectIsAuthenticated } from './app/slices/authSlice';
import { selectLoading ,fetchProjects} from './app/slices/projectsSlice';
// Stylesheets
import './App.scss';

// APP
export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectLoading);

  // ON Render
  useEffect(() => {
    document.title = `Obscura FotoFlow`;
    dispatch(checkAuthStatus())
    dispatch(fetchProjects())
  }, []);

  // RENDER
  return (
    <div className="App">
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
            { isAuthenticated &&
              <>
                <Route exact   path="/"               element={<Home/>}/>
                <Route        path="/project/:id"    element={<Project/>}/>
                <Route exact path="/gallery/:id/:collectionId?" element={<Galleries/>}/>
                <Route      path="/projects"       element={<Projects/>}/>
                <Route     path="/storage"        element={<Storage/>}/>
                <Route    path="/notifications"  element={<Notifications/>}/>
                <Route   path="/subscription"   element={<Subscription/>}/>
                <Route  path="/store"          element={<CommingSoon title={'Store'}/>}/>
                <Route  path="/calendar"       element={<CommingSoon title={'Calendar'}/>}/>
                <Route  path="/invoices"       element={<CommingSoon title={'Financials'}/>}/>
                <Route  path="/accounts"       element={<CommingSoon title={'Accounts'}/>}/>
                <Route  path="/team"           element={<CommingSoon title={'team'}/>}/>
              </> 
            }
            <Route path="/share/:projectId/:collectionId?" element={<ShareProject/>}/>
            <Route path="/selection/:projectId/:collectionId?" element={<Selection/>}/>
            <Route path="/masanory-grid" element={<ImageGallery />}/>
          </Routes>
        )}
    </div>
  );
}
// Line Complexity  1.5 -> 2.0 -> 2.5 -> 2.0 -> 1.0 ->0.9