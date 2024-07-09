import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import DashboardEvents from '../../components/Events/Events';
import AmountCard from '../../components/Cards/AmountCard/AmountCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProject, selectProjects } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { closeModal, openModal, selectModal } from '../../app/slices/modalSlice';

export default function Project() {
  let { id} = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects)
  const {confirmDeleteProject} = useSelector(selectModal)
  const onDeleteConfirm = () => {
    dispatch(deleteProject(id)).then(() => {
      navigate('/projects');
      dispatch(closeModal('confirmDeleteProject'))
      dispatch(showAlert({type:'success-negative', message:`Project <b>${project.name}</b> deleted successfully!`}));// Redirect to /projects page
    })
  };

  // If no projects are available, return early
  if (!projects) return;
  // Find the project with the given id
  const project = projects.find((p) => p.id === id);
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
            onClick={()=>dispatch(openModal('createCollection'))}>

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
            <div className="heading-shoots heading-section">
              <h3 className='heading '>Galleries</h3>
              <div className="new-shoot button tertiary l2 outline"
              onClick={ ()=>{}}>+ New</div>
            </div>
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
                <div className="button secondary outline bold pin" onClick={()=>{
                  navigator.clipboard.writeText(`${project.pin}`)
                  showAlert('success', 'Pin copied to clipboard!')
                }}>PIN: {project.pin}</div>
                <div className="button secondary outline disabled">Share</div>
              </div>
            </div>
            </div>
        )}

          <div className="financials-overview">
            <div className="payments">
              <div className="heading-shoots heading-section">
                <h3 className='heading '>Invoices</h3>
                <div className="new-shoot button tertiary l2 outline"
                onClick={ ()=>{}}>+ New</div>
              </div>
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
              <div className="heading-shoots heading-section">
                <h3 className='heading '>Expances</h3>
                <div className="new-shoot button tertiary l2 outline"
                onClick={ ()=>{}}>+ New</div>
              </div>
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

          <DashboardEvents project={project} />

        </div>
        <AddCollectionModal project={project}/>
        {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm}/>:''}
        <Refresh/>
      </main>
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
            dispatch(openModal('confirmDeleteProject'))
          }}>Delete</div>
        </div>
      </div>
    </>
  )
  }
  // Line complexity 2.0 -> 3.5 -> 2.0