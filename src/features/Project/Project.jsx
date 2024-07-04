import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCollectionById } from '../../utils/CollectionQuery';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import DashboardEvents from '../../components/Events/Events';
import AmountCard from '../../components/Cards/AmountCard/AmountCard';
import Refresh from '../../components/Refresh/Refresh';

export default function Project({ projects,  addCollection,addEvent,addCrew, deleteCollection, deleteProject,setUploadList,setUploadStatus,showAlert}) {
  const navigate = useNavigate();
  // Route Params
  let { id,collectionId } = useParams();
  // Modal
  console.log(projects.length)
  const [modal, setModal] = useState({createCollection: false})
  const openModal = () => setModal({ createCollection: true });
  const closeModal = () => setModal({ createCollection: false });
  // Delete Project Modal
  const[confirmDeleteProject,setConfirmDeleteProject] = useState(false)
  const onDeleteConfirmClose = () => setConfirmDeleteProject(false)
  const onDeleteConfirm = () => deleteProject(id);

  // If no projects are available, return early
  if (!projects) return;
  // Find the project with the given id
  const project = projects.find((p) => p.id === id);
  console.log(project)
  // If the project is not found, redirect to the projects page and return
  if (!project) {
    setTimeout(()=>{
      navigate('/projects');
    },100)
    return;
  }
  else{
  document.title = `${project.name}'s ${project.type}`
  }

  return (
    <>
      <main className='project-page'>
        
        <div className="project-dashboard">

          {
          project.collections.length === 0 ? (
          <>  
          <div className="templates">
            <div className="gallery new" 
            onClick={openModal}>

          <h3 className='heading'>Galleries</h3>
            <div className="thumbnails">
              <div className="thumbnail thumb1">
                <div className="backthumb bthumb1"
                ></div>
                <div className="backthumb bthumb2"></div>
                <div className="backthumb bthumb3"></div>
                <div className="backthumb bthumb4"></div>
              </div>
            </div>
            <div className="gallery-name">New Gallery</div>
            
          </div>
          </div>
          </>
        ) : (
          <div className="gallery-overview">
            
            <div className="galleries">
              <h3 className='heading'>Galleries</h3>
              <Link className={`gallery ${project.projectCover==="" && 'no-images'}`} to={`/project/galleries/${id}`}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                    <div className="backthumb bthumb1"
                    style={
                      {
                        backgroundImage:
                        `url(${project.projectCover!==""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`

                      }}
                    ></div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                  <div className="thumbnail thumb2">
                    <div className="backthumb bthumb1 count"style={
                      {
                        backgroundImage:
                          `url(${project.projectCover?project.projectCover:''})`
                      }}>
                    
                    {project.collections.length} Galleries</div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                    </div>
                  <div className="thumbnail thumb3">
                      <div className="backthumb bthumb1 count" style={
                      {
                        backgroundImage:
                          `url(${project.projectCover?project.projectCover:''})`
                      }}>
                      
                      {project.uploadedFilesCount!==0? project.uploadedFilesCount+' Photos': 'Upload Photos'}</div>
                      <div className="backthumb bthumb2"></div>
                      <div className="backthumb bthumb3"></div>
                    </div>
                </div>
            
              </Link>
              <div className="ctas">
                <div className="button secondary outline bold">+ New Gallery</div>
                <div className="button secondary outline disabled">Share</div>
              </div>
            </div>
            </div>
        )}

          <div className="financials-overview">
            <div className="payments">
              <h3 className='heading'>Invoices</h3>
              <div className="card">
                <div className="chart box">
                    <div className="status large">
                      <div className="signal"></div>
                    </div>
                  <div className="circle green">₹120K</div>
                  <p className="message">All payments are succussful.</p>
                </div>
                <div className="payments-list">
                  <AmountCard amount='₹20K' direction="+ " percentage="10%" status={'confirmed'}/>
                  <AmountCard amount='₹40K' direction="+ " percentage="20%" status={'confirmed'}/>
                  <AmountCard amount='₹60K' direction="+ " percentage="30%" status={'confirmed'}/>
                  <AmountCard amount='₹60K' direction="" percentage="Balance" status={'pending'}/>
                  <div className="button secondary outline disable">Add Invoice</div>
                </div>
              </div>
            </div>
            <div className="payments expances">
              <h3 className='heading'>Expances</h3>
              <div className="card">
                <div className="chart box">
                    <div className="status large">
                      <div className="signal"></div>
                    </div>
                  <div className="circle orange">₹76K</div>
                  <p className="message">All payments are succussful.</p>
                </div>
                <div className="payments-list">
                  <AmountCard amount='₹13K' direction="- " percentage="John Doe" status={'confirmed'}/>
                  <AmountCard amount='₹18K' direction="- " percentage="Abhay V" status={'confirmed'}/>
                  <AmountCard amount='₹9K' direction="- " percentage="Jane Doe" status={'pending'}/>
                  <AmountCard amount='₹25K' direction="- " percentage="Print Shop 1" status={'pending'}/>
                  <AmountCard amount='₹13K' direction="- " percentage="Print Shop 2" status={'pending'}/>
                  <AmountCard amount='₹13K' direction="- " percentage="Print Shop 2" status={'pending'}/>
                  
                </div>
              </div>
            </div>
          </div>

          <DashboardEvents project={project} addEvent={addEvent} addCrew={addCrew}/>

        </div>
      

        <AddCollectionModal project={project} visible={modal.createCollection} onClose={closeModal} onSubmit={addCollection}  />
        {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm} onClose={onDeleteConfirmClose}/>:''}
      
      
        <Refresh/></main>
      <div className="project-info">
      <div className="breadcrumbs">
      <Link className="back" to="/projects">Projects</Link>
      </div>
        <div className="client">
          <h1>{project.name}</h1>
          <div className="type">{project.type}</div>
        </div>
        <div className="project-options">
          <div className="button tertiary" onClick={()=>{
            setConfirmDeleteProject(true)
          }}>Delete</div>
        </div>
          
      </div>
    </>
  )
  }
  // Line complexity 2.0 => 3.5