import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

// Redux
import { deleteProject, selectProjects, selectProjectsStatus, updateProjectName, restoreProject } from '../../app/slices/projectsSlice';
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
import SidePanel from '../../components/Project/SidePanel/SidePanel'

import './Project.scss';
import './ArchiveBanner.scss';
import { ProjectPageCoverImages } from '../../components/ProjectPageCover/ProjectPageCoverImages';
import { isDeveloper, isProduction } from '../../analytics/utils';
import { selectStudio } from '../../app/slices/studioSlice';
import { ChartNoAxesColumnDecreasing } from 'lucide-react';

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
    if(project?.collections.length === 0){

    const timer = setTimeout(() => {
        dispatch(openModal('createCollection'));
      }, 2000); // Using 500ms for a noticeable yet quick delay

      // Cleanup the timeout if the component unmounts or dependencies change
      return () => clearTimeout(timer);
    }
  }, [project]);

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

      if (project.collections.length === 0) {
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

  const isExpired = useMemo(() => {
    if (!project?.createdAt || !project?.projectValidityMonths) return false;

    const createdAt = new Date(project.createdAt);
    const validityMonths = parseInt(project.projectValidityMonths || '6');
    const expiryDate = createdAt;
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    console.log(Date.now() > expiryDate.getTime())
    return Date.now() > expiryDate.getTime();
  }, [project]);
  
  if (!project) return null;

  const isArchived = project.storage?.status === 'archive';
  const archiveDate = project.storage?.storageHistory?.find(h => h.status === 'archive')?.dateMoved;

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
        {isArchived || !isExpired ? (
          <div className="archive-banner">
            <div className="banner-content">
              <div className="status-badge">Archived</div>
              <div className="banner-info">
                <h3>Storage Optimized</h3>
                <p>
                  This project was moved to <strong>Archive Storage</strong> on {archiveDate ? new Date(archiveDate).toLocaleDateString() : 'N/A'}. 
                  Smart Previews are still active, but original files must be restored for download.
                </p>
              </div>
              <div className="banner-actions">
                <button className="button primary small" onClick={handleRestoreProject}>Restore Originals</button>
              </div>
            </div>
          </div>
        ) : isExpired ? (
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
        ) : (
          <ProjectPageCoverImages project={project} />
        )}
        <div className="project-dashboard">
                  <DashboardProjects project={project} />
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
                    <div className={`button tertiary icon pin ${pinIconClass}`} onClick={handlePinCopy}>
                      {pinText}
                    </div>
                      {isArchived ? 'Archived (Only client  and you)' : 'Share'}
                    <button
                      className={`button primary share icon ${(project.uploadedFilesCount > 0 && !isArchived) ? '' : ''}`}
                      onClick={() => project.uploadedFilesCount > 0  && dispatch(openModal('shareGallery'))}
                    >
                      Share
                    </button>
        
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="icon options" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => !isArchived && dispatch(openModal('createCollection'))} disabled={isArchived}>
                          <div className="icon-show add" /> New Gallery
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => dispatch(openModal('confirmDeleteproject'))}>
                          <div className="icon-show delete" /> Delete Project
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