import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
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
  const { confirmDeleteProject } = useSelector(selectModal);
  const domain = useSelector(selectDomain);

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
     {/* Meta tags for SEO and social sharing */}
     <Helmet>
        <title>{`${project.name} - ${project.type}`}</title>
        <meta name="description" content={`Explore the project ${project.name}, a ${project.type} photography project.`} />
        <meta property="og:title" content={project.name} />
        <meta property="og:description" content={`Explore the project ${project.name}, a ${project.type} photography project.`} />
        <meta property="og:image" content={project.projectCover || 'default-thumbnail.jpg'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={project.name} />
        <meta name="twitter:description" content={`Explore the project ${project.name}, a ${project.type} photography project.`} />
        <meta name="twitter:image" content={project.projectCover || 'default-thumbnail.jpg'} />
      </Helmet>
    
      <main className='project-page'>
       
        <div className="project-dashboard">
          <DashboardProjects project={project} />
        </div>
        <SidePanel  project={project}/>
        {/* Modals */}
        <AddCollectionModal project={project} />
        <AddPaymentModal project={project} />
        <AddExpenseModal project={project} />
        <AddBudgetModal project={project} />

      <ShareGallery   project={project} />
        {confirmDeleteProject && <DeleteConfirmationModal onDeleteConfirm={handleDeleteConfirm} />}
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
        <div className="project-options">

        <DropdownMenu>
          <DropdownMenuTrigger ><div className="icon options"></div></DropdownMenuTrigger>
          <DropdownMenuContent>
          <p>New Gallery</p>
          <p>Share</p>
            <DropdownMenuSeparator />
          <p>Delete</p>
          <p>Update Cover</p>
          </DropdownMenuContent>
        </DropdownMenu>

        </div>
      </div>
    </>
  );
}
