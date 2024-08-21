import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
//Components
import DashboardEvents from '../../components/Project Dashboard/Events/Events';
import SidePanel from '../../components/Project/SidePanel/SidePanel';
import Refresh from '../../components/Refresh/Refresh';
// Modals
import DashboardPayments from '../../components/Project Dashboard/Payments/Payments';
import DashboardExpances from '../../components/Project Dashboard/Expances/Expances';
import DashboardProjects from '../../components/Project Dashboard/Projects/Projects';
import AddExpenseModal from '../../components/Modal/AddExpense';
import AddPaymentModal from '../../components/Modal/AddPayment';
import AddBudgetModal from '../../components/Modal/AddBudget';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
// Redux
import { deleteProject, selectProjects, selectProjectsStatus } from '../../app/slices/projectsSlice';
import { closeModal, openModal, selectModal } from '../../app/slices/modalSlice';
import { showAlert } from '../../app/slices/alertSlice';

import './Project.scss'
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';

export default function Project() {
  let { id} = useParams();
  console.log(id)
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const defaultStudio = useSelector(selectUserStudio)
  const projects = useSelector(selectProjects)
  const projectsStatus = useSelector(selectProjectsStatus)
  const {confirmDeleteProject} = useSelector(selectModal)
  const domain = useSelector(selectDomain)

  const onDeleteConfirm = () => {
    dispatch(deleteProject(domain,id)).then(() => {
      navigate(`/${defaultStudio.domain}/projects`);
      dispatch(closeModal('confirmDeleteProject'))
      dispatch(showAlert({type:'success-negative', message:`Project <b>${project.name}</b> deleted successfully!`}));// Redirect to /projects page
    })
  };

  useEffect(() => {
    
  if (projectsStatus=='loading') {
    return <div>Loading...</div>;
  }
  }, [projectsStatus]);
  // If no projects are available, return early
  if (!projects) return;
  const project = projects.find((p) => p.id === id);
  console.log(project)
  // If the project is not found, redirect to the projects page and return
  if (!project) {
    setTimeout(()=>{
      navigate(`/${defaultStudio.domain}/projects`);
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
          <DashboardProjects project={project}/>
            <div className="financials-overview ">
          <DashboardPayments project={project}/>
          <DashboardExpances project={project}/>
            </div>
          <DashboardEvents project={project} />
        </div>
        <SidePanel/>
        {/* Modals */}
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
  // Line complexity 2.0 -> 3.5 -> 2.0 ->2.5 -> 3.0 -> 2.5 -> 1.6 ->0.9