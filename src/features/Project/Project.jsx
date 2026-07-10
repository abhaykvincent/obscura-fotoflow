import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

// Redux
import { deleteProject, selectProjects, selectProjectsStatus, restoreProject } from '../../app/slices/projectsSlice';
import { openModal, selectModal } from '../../app/slices/modalSlice';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';

// Firebase
import { updateProjectLastOpenedInFirestore } from '../../firebase/functions/firestore';

// Components
import DashboardProjects from '../../components/Project Dashboard/Projects/Projects';

// Modals
import ShareGallery from '../../components/Modal/ShareGallery';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import AddExpenseModal from '../../components/Modal/AddExpense';
import AddPaymentModal from '../../components/Modal/AddPayment';
import AddBudgetModal from '../../components/Modal/AddBudget';
import AddEventModal from '../../components/Modal/AddEvent';
import AddCrewModal from '../../components/Modal/AddCrew';

import './Project.scss';
import './ArchiveBanner.scss';
import { ProjectPageCoverImages } from '../../components/ProjectPageCover/ProjectPageCoverImages';
import { isProduction } from '../../analytics/utils';
import { selectStudio } from '../../app/slices/studioSlice';

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const domain = useSelector(selectDomain);
  const projects = useSelector(selectProjects);
  const defaultStudio = useSelector(selectUserStudio);
  const modals = useSelector(selectModal);
  const modalsRef = useRef(modals);
  const projectsStatus = useSelector(selectProjectsStatus);
  const studio = useSelector(selectStudio);
  const [project, setProject] = useState(null);
  const [pinText, setPinText] = useState('');
  const [pinIconClass, setPinIconClass] = useState('hide');
  const [selectedEventId, setSelectedEventId] = useState('');
  

  const selectedProject = useMemo(() => 
    projects?.find((p) => p.id === id),
    [projects, id]
  );

  useEffect(() => {
    if (project && location.state?.openModal === 'shareGallery') {
      dispatch(openModal('shareGallery'));
      // Clear location state to prevent modal from re-opening on reload/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [project, location.state, dispatch, navigate, location.pathname]);

  useEffect(() => {
    modalsRef.current = modals;
  }, [modals]);
  useEffect(() => {
    const isArchived = project?.status === 'archive' || project?.storage?.status === 'archive';
    const isExpired = project?.status === 'expired';

    if (project?.collections.length === 0 && !isArchived && !isExpired) {
      const timer = setTimeout(() => {
        dispatch(openModal('createCollection'));
      }, 2000); // Using 500ms for a noticeable yet quick delay

      // Cleanup the timeout if the component unmounts or dependencies change
      return () => clearTimeout(timer);
    }
  }, [project, dispatch]);

  useEffect(() => {
    if (projectsStatus === 'succeeded' && !selectedProject) {
      navigate(`/${defaultStudio.domain}/projects`);
    }
    setProject(selectedProject);
  }, [selectedProject, defaultStudio.domain, navigate, projectsStatus]);

  useEffect(() => {
    if (project) {
      if(!isProduction){
        let color = project ? '#21ade4ff' : 'gray';
        // developer only        
        console.log(`%c 💻 ------- Developer only -------`, `color: ${color};`);


        console.log(`%c 🔥 Project`, `color: ${color}; font-weight: bold;`,project);
    }
      document.title = `${project.name}'s ${project.type} | ${defaultStudio.name}`;
      setPinText(project.pin);
      
      updateProjectLastOpenedInFirestore(domain, project.id);

      const isArchived = project.status === 'archive' || project.storage?.status === 'archive';
      const isExpired = project.status === 'expired';

      if (project.collections.length === 0 && !isArchived && !isExpired) {
        setTimeout(() => {
          const isAnyModalOpen = Object.values(modalsRef.current).some(Boolean);
          if (!isAnyModalOpen) dispatch(openModal('firstCollection'));
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

  

  const handleDeleteProject = () => {
    const bucketUrl= studio.bucketUrl
    console.log(bucketUrl)
    dispatch(deleteProject({ domain,bucketUrl, projectId: id }));
  }

  const handleRestoreProject = () => {
    dispatch(restoreProject({ domain, projectId: id }));
  }

  const isArchived = project?.status === 'archive' || project?.storage?.status === 'archive';
  const isExpired = project?.status === 'expired';
  
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
      <AddEventModal project={project} />
      <AddCrewModal project={project} eventId={selectedEventId} />

      <main className='project-page'>
        {isExpired ? (
          <div className="archive-banner expired-banner">
            <div className="banner-content">
              <div className="status-badge">Expired</div>
              <div className="banner-info">
                <h3>Public Access Ended</h3>
                <p>
                  This gallery's public access period has ended. It is no longer visible to guests without a PIN. 
                  You can still manage and share it as needed.
                </p>
              </div>
              <div className="banner-actions">
                <button className="button secondary small" onClick={() => dispatch(openModal('shareGallery'))}>Extend Validity</button>
              </div>
            </div>
          </div>
        ) : isArchived ? (
          <div className="archive-banner">
            <div className="banner-content">
              <div className="status-badge">Archived</div>
              <div className="banner-info">
                <h3>Project Archived</h3>
                <p>
                  This project is currently archived and not active. Only the client and studio can view high-resolution photos.
                </p>
              </div>
              <div className="banner-actions">
                <button className="button primary small" onClick={handleRestoreProject}>Restore Project</button>
              </div>
            </div>
          </div>
        ) : (
          <>
         {/*  <ProjectPageCoverImages project={project} /> */}
          </>
        )}
        <div className={`project-dashboard ${isExpired ? 'locked' : ''}`}>
          <DashboardProjects project={project} setSelectedEventId={setSelectedEventId} />
        </div>
              </main>
        
              {createPortal(
                <div className="project-info gallary-page-info project-page-info">
                  <div className="breadcrumbs">
                    <Link className="back" to={`/${defaultStudio.domain}/projects`}>
                      Projects
                    </Link>
                  </div>
                  <div className="client"></div>
                  <div className="project-options options">
                      {isExpired ? 'Expired' : isArchived ? 'Archived (Only client and you)' : 'Share'}
                    <button
                      className={`button primary share icon ${(project.uploadedFilesCount > 0 || isExpired) ? '' : 'disabled'}`}
                      onClick={() => (project.uploadedFilesCount > 0 || isExpired) && dispatch(openModal('shareGallery'))}
                    >
                      {isExpired ? 'Extend Validity' : 'Share'}
                    </button>
        
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="icon options" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="dropdown-menu-content" align="end" sideOffset={4}>
                        <DropdownMenuItem
                          onSelect={() => !isArchived && !isExpired && dispatch(openModal('createCollection'))}
                          disabled={isArchived || isExpired}
                          className="dropdown-menu-item"
                        >
                          <div className="icon-show add" />
                          <span>New Gallery</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="dropdown-menu-separator" />
                        <DropdownMenuItem
                          onSelect={() => dispatch(openModal('confirmDeleteproject'))}
                          className="dropdown-menu-item"
                        >
                          <div className="icon-show delete" />
                          <span>Delete Project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>,
                document.getElementById('header-feature-content') || document.body
              )}
            </>
          );
        }