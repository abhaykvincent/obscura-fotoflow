import React, { useState } from 'react'
import AddEventModal from '../../Modal/AddEvent'
import AddCrewModal from '../../Modal/AddCrew';
import CrewCard from '../../Cards/CrewCard/CrewCard';
import { getUserByID, teams } from '../../../data/teams';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { showAlert } from '../../../app/slices/alertSlice';
import DashboardPayments from '../Payments/Payments';
import DashboardExpances from '../Expances/Expances';
import DashboardEvents from '../Events/Events';
import DashboardTabs from './DashboardTabs/DashboardTabs';
import AddProjectModal from '../../Modal/AddProject/AddProject';
import CollectionsPanel from '../../Project/Collections/CollectionsPanel';
import EmptyGalleriesState from './EmptyGalleriesState/EmptyGalleriesState';
import SidePanel from '../../Project/SidePanel/SidePanel'
import { ProjectCover } from '../../ProjectPageCover/ProjectPageCover';
import StatusPipeline from '../StatusPipeline/StatusPipeline';
import { acceptSelectionReset, declineSelectionReset, selectSelectionRequests } from '../../../app/slices/selectionRequestSlice';
import { selectUserStudio } from '../../../app/slices/authSlice';
import HistoryLog from './HistoryLog/HistoryLog';

function DashboardProjects({project, setSelectedEventId}){
  const dispatch =useDispatch()
  const navigate = useNavigate();
  const { studioName } = useParams();
  const [projectDashboardView, setProjectDashboardView] = useState('abstracti')
  const [activeTab, setActiveTab] = useState('galleries');
  const selectionRequests = useSelector(selectSelectionRequests);
  const defaultStudio = useSelector(selectUserStudio);

  const isArchived = project?.status === 'archive' || project?.storage?.status === 'archive';
  const isExpired = project?.status === 'expired';

  const pendingRequest = selectionRequests.find(req => req.projectId === project?.id);

  // Inside your component
  return (
    <>
      <StatusPipeline 
        project={project} 
        currentView={projectDashboardView}
        setView={setProjectDashboardView}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <ProjectCover 
        project={project} 
        projectDashboardView={projectDashboardView} 
        setProjectDashboardView={setProjectDashboardView} 
      />
      
      
      {pendingRequest && (
        <div className="selection-requests-list dashboard">
          <div className="selection-request-item island">
            <div className="request-info">
              <p className="request-text">Client requested to select again for <b>{pendingRequest.projectName}</b></p>
            </div>
            <div className="request-actions">
              <div className="button secondary small" onClick={() => {
                dispatch(declineSelectionReset({ domain: defaultStudio.domain, projectId: project.id }));
                dispatch(showAlert({ type: 'info', message: 'Selection reset request cancelled.' }));
              }}>Cancel</div>
              <div className="button primary small outline" onClick={() => {
                dispatch(acceptSelectionReset({ domain: defaultStudio.domain, projectId: project.id }));
                dispatch(showAlert({ type: 'success', message: 'Selection reset allowed!' }));
              }}>Accept</div>
              <div className="button primary small" onClick={() => dispatch(openModal('shareGallery'))}>Share</div>
            </div>
          </div>
        </div>
      )}

      {/* <div className="project-bashboard-toolbar">
        {setProjectDashboardView && (
          <div className="view-cta">
              <div className="control-wrap">
                  <div className="controls">
                      <div className={`control ctrl-active ${projectDashboardView === 'dashboard' ? 'active' : ''}`}
                          onClick={() => setProjectDashboardView('dashboard')}
                      ><div className="icon list-view"></div></div>
                      <div className={`control ctrl-all ${projectDashboardView === 'abstract' ? 'active' : ''}`}
                          onClick={() => setProjectDashboardView('abstract')}
                      ><div className="icon card-view"></div></div>
                  </div>
              </div>
          </div>
        )}
      </div> */}
    {
      projectDashboardView === 'abstract'?
      (project.collections.length === 0 ? (
        !isExpired && (
          <div className="galleries">
            <div className="heading-section">
              <h3 className='heading'>Galleries <span>{project.collections.length}</span></h3>
              <button
                type="button"
                className="button primary small"
                disabled={isArchived || isExpired}
                onClick={() => dispatch(openModal('createCollection'))}
              >
                + Create Gallery
              </button>
            </div>
            <EmptyGalleriesState
              disabled={isArchived || isExpired}
              onCreate={() => dispatch(openModal('createCollection'))}
            />
          </div>
        )
      ) : (
        <>
          <CollectionsPanel {...{project,collectionId:project.collections[0]?.id}}/>
        </>
      ))
      :<>
      <AddProjectModal />
        <DashboardTabs 
          project={project} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSelectedEventId={setSelectedEventId}
        />
        {/* <div className="sub-projects">
          <h4 className='heading-section heading'>Sub Projects</h4>
          <div className="sub-projects-body">
            <div className="actions">
              <div className="button tertiary outline icon add"
                  onClick={()=>dispatch(openModal('createProject'))}
              >Sub-project</div>
          </div>
          </div>
        </div> */}
      </>
    }
          {/* <HistoryLog project={project} /> */}

      
    </>
  )
}

export default DashboardProjects
// Line Complexity  1.0 -> 