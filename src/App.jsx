import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
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
// Redux 
import { checkAuthStatus, selectIsAuthenticated } from './app/slices/authSlice';
import { selectProjects,selectLoading ,fetchProjects} from './app/slices/projectsSlice';
// Stylesheets
import './App.scss';
import { selectModal } from './app/slices/modalSlice';

function App() {
  const dispatch = useDispatch();

  const projects = useSelector(selectProjects);
  const modals = useSelector(selectModal);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // Upload progress
  const [uploadList, setUploadList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('close');
  const isLoading = useSelector(selectLoading);
  // Modal
  const [modal, setModal] = useState({ createProject: false })
  const openModal = () => setModal({ createProject: true });
  const closeModal = () => setModal({ createProject: false });

  // ON RENDER
  useEffect(() => {
    document.title = `Obscura FotoFlow`;
    dispatch(checkAuthStatus())
    dispatch(fetchProjects())
  }, []);

  useEffect(() => {
    if(uploadStatus === 'completed'){
      setTimeout(() => setUploadStatus('close'), 1000)
    }
  }, [uploadStatus])

  const publicPages = window.location.href.includes('share') || window.location.href.includes('selection')|| window.location.href.includes('masanory-grid')
  
  // Render
  return (
    <div className="App">
      {isAuthenticated && (!publicPages)? (
        <>
          <Header />
          <Sidebar />
          <Alert />
          <UploadProgress {...{uploadList,uploadStatus}}/>
          <AddProjectModal />
        </>
      ) : (
        <>{ !publicPages && <LoginModal/> }</>
      )}
      {
        isLoading ? (
          <Loading/>
        ) : (
          <Routes>
            { isAuthenticated &&
              <>
                <Route exact path="/" element={<Home/>}/>
                <Route       path="/project/:id" element={<Project {...{setUploadList,setUploadStatus, }} />}/>
                <Route exact path="/project/galleries/:id/:collectionId?" element={<Galleries {...{setUploadList,setUploadStatus }} />}/>
                <Route       path="/projects" element={<Projects/>}/>
               
                <Route path="/storage" element={<Storage/>}/>
                <Route path="/notifications" element={<Notifications/>}/>
                <Route path="/subscription" element={<Subscription/>}/>
              </> 
            }
            <Route path="/share/:projectId/:collectionId?" element={<ShareProject/>}/>
            <Route path="/selection/:projectId/:collectionId?" element={<Selection />}/>
            <Route path="/masanory-grid" element={<ImageGallery />}/>
          </Routes>
        )
      }
      
    </div>
  );
}

export default App;
// Line Complexity  1.5 -> 2.0 -> 2.5 -> 2.0 -> 1.0