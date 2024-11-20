import React, { useEffect, useMemo, useState } from 'react';
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
import { deleteProject, selectProjects, selectProjectsStatus, updateProjectName } from '../../app/slices/projectsSlice';
import { closeModal, closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
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
import { updateProjectLastOpenedInFirestore } from '../../firebase/functions/firestore';

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const defaultStudio = useSelector(selectUserStudio);
  const projects = useSelector(selectProjects);
  const projectsStatus = useSelector(selectProjectsStatus);
  const domain = useSelector(selectDomain);

  // Delete Project Modal
  const onDeleteConfirm = () => dispatch(deleteProject({domain,projectId:id}))


  // Local state for the project
  const [project, setProject] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  // Update project whenever projects or id changes
  const selectedProject = useMemo(
    () => projects?.find((p) => p.id === id),
    [projects, id]
  );
  
  useEffect(() => {
    if (projectsStatus === 'succeeded' && !selectedProject) {
      navigate(`/${defaultStudio.domain}/projects`);
    }
    setProject(selectedProject);
  }, [projectsStatus, selectedProject, defaultStudio.domain, navigate]);

  useEffect(() => {
    if (project) {
      console.log(project)
      document.title = `${project.name}'s ${project.type} | ${defaultStudio.name}`;
      updateProjectLastOpenedInFirestore(domain, project.id);
    }
  }, [project]);
  useEffect(() => {
      console.log(projects)
  }, [projects]);

  const handleDeleteConfirm = () => {
    dispatch(deleteProject(domain, id)).then(() => {
      navigate(`/${defaultStudio.domain}/projects`);
      dispatch(closeModalWithAnimation('confirmDeleteProject'));
      dispatch(showAlert({ type: 'success-negative', message: `Project <b>${project.name}</b> deleted successfully!` }));
    });
  };

  // If the project is not found, return null
  if (!project) return null;
  const handleSave = () => {
    if (newName && newName !== project.name) {
      dispatch(updateProjectName({ domain, projectId: id, newName })).then(() => {
        setIsEditing(false);
        // Update local project state in Redux
        setProject({ ...project, name: newName });
      });
    }
  };

  const handleCancel = () => setIsEditing(false);
  const handleNameDoubleClick = () => {

    setIsEditing(true);
    setNewName(project.name);
  };


  return (
    <>
      <ShareGallery   project={project} />
      <DeleteConfirmationModal itemType="project" itemName={project.name}  onDeleteConfirm={onDeleteConfirm} />
    
        {/* Modals */}
      <AddCollectionModal project={project} />
        <AddPaymentModal project={project} />
        <AddExpenseModal project={project} />
        <AddBudgetModal project={project} />
      <main className='project-page'>
        <div className="project-page-cover"
          style={{
            backgroundImage:  `url(${project.projectCover})`
          }}
        >

          <div className="cover-tools">
            <div className="button transparent-button secondary icon image">Change Cover</div>
            <div className="button transparent-button secondary icon set-focus">Set focus</div>
          </div>
        </div>
        <div className="project-dashboard">
          <DashboardProjects project={project} />
        </div>
        {/* <SidePanel  project={project}/> */}

        <Refresh />
      </main>
      <div className="project-info gallary-page-info project-page-info">
        <div className="breadcrumbs">
          <Link className="back" to={`/${defaultStudio.domain}/projects`}>Projects</Link>
        </div>
        <div className="client">
        {isEditing ? (
          <div className="editable-data ">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="input-edit-actions">
              <button className={`${newName === project.name ? 'disabled' : ''} button primary icon icon-only check`} onClick={handleSave}></button>
              <button className="button secondary  icon icon-only close" onClick={handleCancel}></button>
            </div>
          </div>
        ) : (
          <h1 onDoubleClick={handleNameDoubleClick}>{project.name}</h1>
        )}
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
                onSelect={() => { dispatch(openModal('confirmDeleteproject'))}}>
                Delete Project
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => { handleNameDoubleClick()}}>
                Edit Project name
              </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

        </div>
      </div>

    </>
  );
}
