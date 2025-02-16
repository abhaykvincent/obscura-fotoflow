import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Redux
import { deleteProject, selectProjects, selectProjectsStatus, updateProjectName } from '../../app/slices/projectsSlice';
import { closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';

//  Firebase
import { updateProjectLastOpenedInFirestore, updateProjectStatusInFirestore } from '../../firebase/functions/firestore';

// Components
import DashboardProjects from '../../components/Project Dashboard/Projects/Projects';
import Refresh from '../../components/Refresh/Refresh';
import { ProjectCover } from '../../components/ProjectPageCover/ProjectPageCover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

// Modals
import ShareGallery from '../../components/Modal/ShareGallery';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import AddExpenseModal from '../../components/Modal/AddExpense';
import AddPaymentModal from '../../components/Modal/AddPayment';
import AddBudgetModal from '../../components/Modal/AddBudget';

import './Project.scss';

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const defaultStudio = useSelector(selectUserStudio);
  const projects = useSelector(selectProjects);
  const projectsStatus = useSelector(selectProjectsStatus);
  const domain = useSelector(selectDomain);
  const modals = useSelector(selectModal);
  const [projectStatusLocal, setProjectStatusLocal] = useState(projectsStatus);
  // Delete Project Modal
  const onDeleteConfirm = () => dispatch(deleteProject({domain,projectId:id}))


  const modalsRef = useRef(modals); // Create a ref to store the latest modals state

  // Update the ref whenever modals changes
  useEffect(() => {
    modalsRef.current = modals;
  }, [modals]);
  const [project, setProject] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  // Update project whenever projects or id changes
  const selectedProject = useMemo(
    () => projects?.find((p) => p.id === id),
    [projects, id]
  );
  const handlePinClick = () => {
    // Copy pin to clipboard
    navigator.clipboard.writeText(project?.pin).then(() => {
      setPinIconClass('copying'); // Temporarily add copying class
      setPinText('Coping'); // Temporarily change text to "Copied"

      setTimeout(() => {
        setPinIconClass(''); // Reset icon class after 1 second
        setPinText('Copied  '); // Reset text after 5 seconds
      }, 1000);

      setTimeout(() => {
        setPinText(project?.pin); // Reset text after 5 seconds
      }, 8000);
    }).catch(err => {
      console.error("Failed to copy pin:", err);
    });
  };

  const [pinText, setPinText] = useState(project?.pin );
  const [pinIconClass, setPinIconClass] = useState(project?.pin?'':'hide');
  // Local state for the project
  useEffect(() => {
    if (projectsStatus === 'succeeded' && !selectedProject) {
      navigate(`/${defaultStudio.domain}/projects`);
    }
    setProject(selectedProject);
  }, [projectsStatus, selectedProject, defaultStudio.domain, navigate]);

  useEffect(() => {
    if (project) {
      console.log(project);
      document.title = `${project.name}'s ${project.type} | ${defaultStudio.name}`;
      updateProjectLastOpenedInFirestore(domain, project.id);
      setPinText(project?.pin);

      if (project.collections.length === 0) {
        setTimeout(() => {
          // Use the ref to get the latest modals state
          const isAnyModalOpen = Object.values(modalsRef.current).some(modal => modal === true);
          console.log(modalsRef.current);
          if (!isAnyModalOpen) {
            dispatch(openModal('createCollection'));
          }
        }, 3000);
      }
    }
  }, [project, dispatch, domain, defaultStudio.name]);
  
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
        <ProjectCover project={project} />
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
        {/* {isEditing ? (
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
          <h1 onClick={handleNameDoubleClick}>{project.name}</h1>
        )}
          <div className="type">{project?.type}</div>
           */}
        </div>
        <div className="project-options options">
        {/* Project starus with select with different project state */}
       
        <div className={`project-status ${projectStatusLocal}`}>
          <div className="project-status-select">
            <div className="project-status-select-value">
              <select
              className="button secondery"
              value={projectStatusLocal}
              onChange={(e) => {
                const newStatus = e.target.value;
                    setProjectStatusLocal(newStatus);
                     updateProjectStatusInFirestore(defaultStudio.domain,project.id, newStatus)
                /* dispatch(updateProjectStatus({ domain, projectId: id, newStatus })); */
              }}
              > 
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="selected">Selected</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
              </select>              
              <div className="status-signal"></div>

            </div>
            </div>
          </div>
        <div className={`button tertiary icon pin ${pinIconClass}`} onClick={handlePinClick}>{pinText}</div>
            <div className={`button primary share icon ${project?.uploadedFilesCount>0 ? '':'disabled'}`} 
            onClick={()=>{
              (project.collections.length > 0 && project.uploadedFilesCount>0) && 
                dispatch(openModal('shareGallery')) 
            }
          }
            target="_blank">Share</div>
        <DropdownMenu>
          <DropdownMenuTrigger >
            <div className="icon options"></div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>

            <DropdownMenuItem>
            <div className="icon-show add"></div> New Gallery</DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => { dispatch(openModal('confirmDeleteproject'))}}>
                <div className="icon-show delete"></div>
                Delete Project
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => { handleNameDoubleClick()}}>
                <div className="icon-show edit"></div>
                Edit Project name
              </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>

        </div>
      </div>

    </>
  );
}

// --> 258 -->