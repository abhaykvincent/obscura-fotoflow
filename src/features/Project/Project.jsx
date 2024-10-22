import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Components
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
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';

import './Project.scss';
import { DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger, } from '@radix-ui/react-dropdown-menu';
import ShareGallery from '../../components/Modal/ShareGallery';

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const defaultStudio = useSelector(selectUserStudio);
  const projects = useSelector(selectProjects);
  const projectsStatus = useSelector(selectProjectsStatus);
  const domain = useSelector(selectDomain);

  const [confirmDeleteProject,setConfirmDeleteProject] = useState(false)
  // Delete Project Modal
  const onDeleteConfirmClose = () => setConfirmDeleteProject(false)
  const onDeleteConfirm = () => dispatch(deleteProject({domain,projectId:id}))


  // Local state for the project
  const [project, setProject] = useState(null);

  // Update project whenever projects or id changes
  useEffect(() => {
    const selectedProject = projects?.find((p) => p.id === id);
    setProject(selectedProject);

    if (projectsStatus === 'succeeded' && !selectedProject) {
      navigate(`/${defaultStudio.domain}/projects`);
    }
  }, [projects, id, projectsStatus, defaultStudio.domain, navigate]);

  useEffect(() => {
    if (project) {
      console.log(project)
      document.title = `${project.name} - ${project.type}`;
    }
  }, [project]);
  useEffect(() => {
      console.log(projects)
  }, [projects]);

  const handleDeleteConfirm = () => {
    dispatch(deleteProject(domain, id)).then(() => {
      navigate(`/${defaultStudio.domain}/projects`);
      dispatch(closeModal('confirmDeleteProject'));
      dispatch(showAlert({ type: 'success-negative', message: `Project <b>${project.name}</b> deleted successfully!` }));
    });
  };

  // If the project is not found, return null
  if (!project) return null;

  return (
    <>
    
      <main className='project-page'>
       
        <div className="project-dashboard">
          <DashboardProjects project={project} />
        </div>
        {/* <SidePanel  project={project}/> */}
        {/* Modals */}
        <AddCollectionModal project={project} />
        <AddPaymentModal project={project} />
        <AddExpenseModal project={project} />
        <AddBudgetModal project={project} />

      <ShareGallery   project={project} />
        <Refresh />
      </main>
      <div className="project-info">
        <div className="breadcrumbs">
          <Link className="back" to={`/${defaultStudio.domain}/projects`}>Projects</Link>
        </div>
        <div className="client">
          <h1>{project.name}</h1>
          <div className="type">{project.type}</div>
        </div>
        <div className="project-options options">

        <DropdownMenu>
          <DropdownMenuTrigger >
            <div className="icon options"></div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
          <DropdownMenuItem>New Gallery</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                // Your action for Delete
                setConfirmDeleteProject(true);
              }}
            >
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {confirmDeleteProject && <DeleteConfirmationModal itemType="project" itemName={project.name}  onDeleteConfirm={onDeleteConfirm} />}

        </div>
      </div>
    </>
  );
}
