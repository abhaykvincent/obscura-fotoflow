import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
//Components
import DashboardEvents from '../../components/Project Dashboard/Events/Events';
import AmountCard from '../../components/Cards/AmountCard/AmountCard';
import Refresh from '../../components/Refresh/Refresh';
// Modals
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import AddExpenseModal from '../../components/Modal/AddExpense';
import AddPaymentModal from '../../components/Modal/AddPayment';
import AddBudgetModal from '../../components/Modal/AddBudget';
// Utils
import { formatDecimalK, formatDecimalRs } from '../../utils/stringUtils';
// Redux
import { deleteProject, selectProjects } from '../../app/slices/projectsSlice';
import { closeModal, openModal, selectModal } from '../../app/slices/modalSlice';
import { showAlert } from '../../app/slices/alertSlice';
import DashboardPayments from '../../components/Project Dashboard/Payments/Payments';
import DashboardExpances from '../../components/Project Dashboard/Expances/Expances';

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
  const project = projects.find((p) => p.id === id);
  console.log(project)
  // If the project is not found, redirect to the projects page and return
  if (!project) {
    setTimeout(()=>{navigate('/projects');},100)
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
              <div className="gallery new" 
              onClick={()=>dispatch(openModal('createCollection'))}>
                <div className="heading-section">

            <h3 className='heading'>Galleries <span>{project.collections.length}</span></h3>
                </div>
              <div className="thumbnails">
                <div className="thumbnail thumb1">
                  <div className="backthumb bthumb1"
                  >
              <div className="button primary outline">New Gallery</div></div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                  <div className="backthumb bthumb4"></div>
                </div>
              </div>
              
            </div>
          </>
        ) : (
          <div className="gallery-overview">
            <div className="galleries">
              <div className="heading-shoots heading-section">
                <h3 className='heading '>Galleries <span>{project.collections.length}</span></h3>
                <div className="new-shoot button tertiary l2 outline"
                  onClick={ ()=>{}}>+ New
                </div>
              </div>
              <Link className={`gallery ${project.projectCover==="" && 'no-images'}`} to={`/gallery/${id}`}>
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
                    }}></div>
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
            <DashboardPayments project={project}/>
            <DashboardExpances project={project}/>
          </div>

          <DashboardEvents project={project} />

        </div>
        <AddCollectionModal project={project}/>
        <AddPaymentModal  project={project}/>
        <AddExpenseModal  project={project}/>
        <AddBudgetModal  project={project}/>
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
  // Line complexity 2.0 -> 3.5 -> 2.0 ->2.5 -> 3.0 -> 2.5 ->