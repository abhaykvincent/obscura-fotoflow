import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
// Redux 
import { checkAuthStatus, selectIsAuthenticated } from './app/slices/authSlice';
import { showAlert } from './app/slices/alertSlice';
function App() {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // Alert
  const [alert, setAlert] = useState({ type: '', message: '', show: false });
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
        dispatch(showAlert({type:'success-negative', message:`Project <b>${project.name}</b> deleted successfully!`}));// Redirect to /projects page
      }, 700);
    })
    .catch((error) => {
      console.error('Error deleting project:', error);
      dispatch(showAlert({type:'error', message:` error.message`}));
    })
  };
  const addCollection = (projectId, newCollection) => {
    addCollectionToFirestore(projectId,newCollection)
    .then((id)=>{
      const updatedProjects = projects.map((project) => {
        if (project.id === projectId) {
          const updatedCollections = [...project.collections, {id,...newCollection}];
          dispatch(showAlert({type:'success', message:'New Collection created!'}))
          return { ...project, collections: updatedCollections };
        }
        return project;
      });
      setProjects(updatedProjects);
      dispatch(showAlert({type:'success', message:`Collection <b>${newCollection.name}</b> added successfully!`}));
      navigate(`/project/galleries/${projectId}/${id}`);
    })
    .catch((error) => {
      dispatch(showAlert({type:'error', message:`Error adding collection: ${error.message}`}));
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
      dispatch(showAlert({type:'success', message:`Event <b>${newEvent.name}</b> added successfully!`}));
    })
    .catch((error) => {
      console.log(error.message)
      dispatch(showAlert({type:'error', message:`Error adding event: ${error.message}`}));
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
          dispatch(showAlert({type:'success', message:`Collection deleted!`}));
          return { ...project, collections: updatedCollections };
        }
        return project;
      });
      setProjects(updatedProjects);
    })
    .catch((error) => {
      dispatch(showAlert({type:'error', message:`Error deleting collection: ${error.message}`}));
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
        dispatch(showAlert({type:'success', message:`Crew member <b>${user.name}</b> added successfully!`}));
      })
        .catch((error) => {
          dispatch(showAlert({type:'error', message:`Error adding crew member: ${error.message}`}));
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
          <AddProjectModal visible={modal.createProject} onClose={closeModal} onSubmit={addProject} openModal={openModal} />
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
                <Route path="/project/:id" element={<Project {...{ projects, addCollection,addEvent,addCrew, deleteCollection, deleteProject,setUploadList,setUploadStatus, }} />}/>
                <Route exact path="/project/galleries/:id/:collectionId?" element={<Galleries {...{ projects, addCollection, addCrew,deleteCollection, deleteProject,setUploadList,setUploadStatus }} />}/>
                <Route path="/projects" element={<Projects {...{ projects, addProject, isLoading,openModal }} />}/>
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
// Line Complexity  1.5 -> 2.0 -> 2.5