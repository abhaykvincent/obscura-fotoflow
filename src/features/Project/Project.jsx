import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

// Redux
import { deleteProject, selectProjects, selectProjectsStatus, updateProjectName } from '../../app/slices/projectsSlice';
import { closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';

// Firebase
import { updateProjectLastOpenedInFirestore, updateProjectStatusInFirestore } from '../../firebase/functions/firestore';

// Components
import DashboardProjects from '../../components/Project Dashboard/Projects/Projects';
import Refresh from '../../components/Refresh/Refresh';
import { ProjectCover } from '../../components/ProjectPageCover/ProjectPageCover';

// Modals
import ShareGallery from '../../components/Modal/ShareGallery';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import AddExpenseModal from '../../components/Modal/AddExpense';
import AddPaymentModal from '../../components/Modal/AddPayment';
import AddBudgetModal from '../../components/Modal/AddBudget';

import './Project.scss';
import { ProjectPageCoverImages } from '../../components/ProjectPageCover/ProjectPageCoverImages';

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const domain = useSelector(selectDomain);
  const projects = useSelector(selectProjects);
  const defaultStudio = useSelector(selectUserStudio);
  const modals = useSelector(selectModal);
  const modalsRef = useRef(modals);
  const projectsStatus = useSelector(selectProjectsStatus);

  const [project, setProject] = useState(null);
  const [pinText, setPinText] = useState('');
  const [pinIconClass, setPinIconClass] = useState('hide');
  

  const selectedProject = useMemo(() => 
    projects?.find((p) => p.id === id),
    [projects, id]
  );

  useEffect(() => {
    modalsRef.current = modals;
  }, [modals]);

  useEffect(() => {
    if (projectsStatus === 'succeeded' && !selectedProject) {
      navigate(`/${defaultStudio.domain}/projects`);
    }
    setProject(selectedProject);
  }, [selectedProject, defaultStudio.domain, navigate, projectsStatus]);

  useEffect(() => {
    if (project) {
      document.title = `${project.name}'s ${project.type} | ${defaultStudio.name}`;
      setPinText(project.pin);
      
      updateProjectLastOpenedInFirestore(domain, project.id);

      if (project.collections.length === 0) {
        setTimeout(() => {
          const isAnyModalOpen = Object.values(modalsRef.current).some(Boolean);
          if (!isAnyModalOpen) dispatch(openModal('createCollection'));
        }, 3000);
      }
    }
  }, [project, dispatch, domain, defaultStudio.name]);

  const handlePinCopy = () => {
    navigator.clipboard.writeText(project?.pin).then(() => {
      setPinIconClass('copying');
      setPinText('Copied');

      setTimeout(() => {
        setPinIconClass('');
        setPinText(project.pin);
      }, 2000);
    });
  };

  

  const handleDeleteProject = () => 
    dispatch(deleteProject({ domain, projectId: id }));

  if (!project) return null;

  return (
    <>
      <ShareGallery project={project} />
      <DeleteConfirmationModal 
        itemType="project" 
        itemName={project.name}  
        onDeleteConfirm={handleDeleteProject} 
      />

      <AddCollectionModal project={project} />
      <AddPaymentModal project={project} />
      <AddExpenseModal project={project} />
      <AddBudgetModal project={project} />

      <main className='project-page'>
        <ProjectPageCoverImages project={project} />
        <div className="project-dashboard">
          <DashboardProjects project={project} />
        </div>
        <Refresh />
      </main>

      <div className="project-info gallary-page-info project-page-info">
        <div className="breadcrumbs">
          <Link className="back" to={`/${defaultStudio.domain}/projects`}>
            Projects
          </Link>
        </div>
        <div className="client"></div>
        <div className="project-options options">
          

          <div className={`button tertiary icon pin ${pinIconClass}`} onClick={handlePinCopy}>
            {pinText}
          </div>

          <button
            className={`button primary share icon ${project.uploadedFilesCount > 0 ? '' : 'disabled'}`}
            onClick={() => project.uploadedFilesCount > 0 && dispatch(openModal('shareGallery'))}
          >
            Share
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="icon options" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <div className="icon-show add" /> New Gallery
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => dispatch(openModal('confirmDeleteproject'))}>
                <div className="icon-show delete" /> Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}