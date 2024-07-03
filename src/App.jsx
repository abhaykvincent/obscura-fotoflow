import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
//Firebase functions
import { 
  fetchProjects,
  addCollectionToFirestore, 
  deleteProjectFromFirestore, 
  deleteCollectionFromFirestore,
  addEventToFirestore,
  addCrewToFirestore, 
} from './firebase/functions/firestore';
// Components
import './App.scss';
import Alert from './components/Alert/Alert';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import UploadProgress from './components/UploadProgress/UploadProgress';
import Subscription from './components/Subscription/Subscription';
import AddProjectModal from './components/Modal/AddProject';
// Features
import Home from './features/Home/Home';
import Project from './features/Project/Project';
import Projects from './features/Projects/Projects';
import LoginModal from './features/Login/Login';
import ShareProject from './features/Share/Share';
import Storage from './features/Storage/Storage';
import Galleries from './features/Galleries/Galleries';
import ImageGallery from './draft/masanory-grid';
import Selection from './features/Selection/Selection';
import Notifications from './features/Notifications/Notifications';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus, selectIsAuthenticated } from './app/slices/authSlice';

function App() {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // Alert
  const [alert, setAlert] = useState({ type: '', message: '', show: false });
  const showAlert = (type, message) => setAlert({ type, message, show: true });
  // Core Data
  const [projects, setProjects] = useState([]);
  // Upload progress
  const [uploadList, setUploadList] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('close');
  const [isLoading, setIsLoading] = useState(true);
  // Modal
  const [modal, setModal] = useState({ createProject: false })
  const openModal = () => setModal({ createProject: true });
  const closeModal = () => setModal({ createProject: false });

  useEffect(() => {
    if(uploadStatus === 'completed'){
      setTimeout(() => {
        setUploadStatus('close')
      }, 1000)
    }
  }, [uploadStatus])
  // Fetch Projects
  useEffect(() => {
    console.log('App Component Triggered !!')
    document.title = `Obscura FotoFlow`;
    dispatch(checkAuthStatus())
    loadProjects()
  }, []);
  useEffect(() => {
    console.log('projects changed !!')
    console.group(projects)
  }, [projects]);

  const loadProjects = () => {
    setIsLoading(true);
    fetchProjects()
    .then((fetchedProjects) => {
      setProjects(fetchedProjects)
      setIsLoading(false);
    });
  };

  // Project/Collection Data Logic
  const addProject = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
    navigate(`/project/${newProject.id}`);
  };
  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(project => project.id !== projectId)
    const project = projects.find(project => project.id === projectId) || {}

    deleteProjectFromFirestore(projectId)
    .then(() => {
      navigate('/projects');
      setTimeout(() => {
        const projectElement = document.querySelector(`.${projectId}`);
        projectElement.classList.add('delete-caution');
      }, 1);
      setTimeout(() => {
        setProjects(updatedProjects);
        showAlert('success-negative', `Project <b>${project.name}</b> deleted successfully!`);// Redirect to /projects page
      }, 700);
    })
    .catch((error) => {
      console.error('Error deleting project:', error);
      showAlert('error', error.message)
    })
  };
  const addCollection = (projectId, newCollection) => {
    addCollectionToFirestore(projectId,newCollection)
    .then((id)=>{
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
          const updatedCollections = [...project.collections, {id,...newCollection}];
          showAlert('success', 'New Collection created!')
          return { ...project, collections: updatedCollections };
        }
        return project;
      });
      setProjects(updatedProjects);
      showAlert('success', `Collection <b>${newCollection.name}</b> added successfully!`);// Redirect to /projects page
      navigate(`/project/galleries/${projectId}/${id}`);
    })
    .catch((error) => {
      showAlert('error', `Error adding collection: ${error.message}`);
    });
  };
  // Function to create new event for a project in the cloud firestore
  // then update the state of the project with the new event
  const addEvent = (projectId, newEvent) => {
    addEventToFirestore(projectId, newEvent)
    .then((Data) => {
      console.log('Data', Data);
       
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
          const updatedEvents = [...project.events, newEvent];
          return { ...project, events: updatedEvents };
        }
        return project;
      });
      setProjects(updatedProjects);
      showAlert('success', `Event <b>${newEvent.name}</b> added successfully!`);// Redirect to /projects page
    })
    .catch((error) => {
      console.log(error.message)
      showAlert('error', `Error adding event: ${error.message}`);
    })

      }
      
  const deleteCollection = (projectId, collectionId) => {
    deleteCollectionFromFirestore(projectId, collectionId)
    .then(() => {
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
            const updatedCollections = project.collections.filter(
            (collection) => collection.id !== collectionId
          );
          showAlert('success', 'Collection deleted!');
          return { ...project, collections: updatedCollections };
        }
        return project;
      });
      setProjects(updatedProjects);
    })
    .catch((error) => {
      showAlert('error', `Error deleting collection: ${error.message}`);
    });
  };
  // Add crew to the event of id 
  const addCrew = (projectId,eventId,user) =>{
    console.log(projectId,eventId,user)
     
      addCrewToFirestore(projectId,eventId,user)
      .then((Data) => {
        const updatedProjects = projects.map((project) => {
          if (project.id === projectId) {
            const updatedEvents = project.events.map((event) => {
              if (event.id === eventId) {
                const updatedCrew = [...event.crews, user];
                return { ...event, crews
                  : updatedCrew };
              }
              return event;
            }
            );
            return { ...project, events: updatedEvents };
          }
          return project;
        })
        setProjects(updatedProjects);
        showAlert('success', `Crew member <b>${user.name}</b> added successfully!`);
        })
        .catch((error) => {
          showAlert('error', `Error adding crew member: ${error.message}`);
        })
      }

  
  const shareOrSelection = window.location.href.includes('share') || window.location.href.includes('selection')|| window.location.href.includes('masanory-grid')
  
  // Render
  return (
    <div className="App">
      {isAuthenticated && (!shareOrSelection)? (
        <>
          <Header />
          <Sidebar />
          <Alert {...alert} setAlert={setAlert} />
          <UploadProgress {...{uploadList,uploadStatus}}/>
          <AddProjectModal visible={modal.createProject} onClose={closeModal} onSubmit={addProject} showAlert={showAlert} openModal={openModal} />
        </>
      ) : (
        <>{!shareOrSelection && <LoginModal/>}</>
      )}
      {
        isLoading ? (
          <div className="loader-wrap">
              <div className="loader"></div>
              <p className='loading-message'>loading projects</p>
          </div>
        ) : (
          <Routes>
            { isAuthenticated ? 
              <>
                <Route exact path="/" element={<Home {...{projects,loadProjects,openModal}} />}/>
                <Route path="/project/:id" element={<Project {...{ projects, addCollection,addEvent,addCrew, deleteCollection, deleteProject,setUploadList,setUploadStatus,showAlert, }} />}/>
                <Route exact path="/project/galleries/:id/:collectionId?" element={<Galleries {...{ projects, addCollection, addCrew,deleteCollection, deleteProject,setUploadList,setUploadStatus,showAlert }} />}/>
                <Route path="/projects" element={<Projects {...{ projects, addProject, showAlert, isLoading,openModal }} />}/>
                <Route path="/storage" element={<Storage {...{projects}}/>}/>
                <Route path="/notifications" element={<Notifications/>}/>
                <Route path="/subscription" element={<Subscription/>}/>
              </> 
              
              : ''
            }
            <Route path="/share/:projectId/:collectionId?" element={<ShareProject {...{ projects }} />}/>
            <Route path="/selection/:projectId/:collectionId?" element={<Selection {...{ projects }} />}/>
            <Route path="/masanory-grid" element={<ImageGallery />}/>
          </Routes>
        )
      }
      
    </div>
  );
}

export default App;
// Line Complexity  1.5 -> 2.0