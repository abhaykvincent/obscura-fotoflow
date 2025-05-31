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

function DashboardProjects({project}){
  const dispatch =useDispatch()
  const navigate = useNavigate();
  console.log(project)
  const { studioName } = useParams();
  const [projectDashboardView, setProjectDashboardView] = useState('abstract')
  // Inside your component
  return (
    <>
     <div className="project-dashboard-header">
      {/* <div className="tools">
        
      <Link to={`/${studioName}/invitation-creator/${project.id}`}>
        <div className="button secondary  icon  invitation disabled" > Invitation</div>
      </Link>
        <div className="button secondary icon user disabled" >Client</div>
      </div> */}
      <div className="view-cta">

        <div className="control-wrap">
            <div className="controls">
            <div className={`control ctrl-active ${projectDashboardView === 'dashboard' ? 'active' : ''}`}
                  onClick={()=>setProjectDashboardView('dashboard')}
                ><div className="icon list-view"></div></div>
                <div className={`control ctrl-all ${projectDashboardView === 'abstract' ? 'active' : ''}`}
                  onClick={()=>setProjectDashboardView('abstract')}
                ><div className="icon card-view"></div></div>
                
            </div>
            <div className={`active`}></div>
          </div>
      </div>
      </div>
      
    {
      projectDashboardView === 'abstract'?
      (project.collections.length === 0 ? (
        <>  
            <div className="gallery new empty-gallery" 
            onClick={()=>dispatch(openModal('createCollection'))}>
              <div className="heading-section">
                <h3 className='heading'>Galleries <span>{project.collections.length}</span></h3>
              </div>
              <div className="thumbnails">
                <div className="thumbnail thumb1">
                  <div className="backthumb bthumb1">
                    <div className="button primary outline"
                    onClick={() => {
                      // Your action for Delete
                      dispatch(openModal('createCollection'));
                    }}
                    >New Gallery</div>
                  </div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                  <div className="backthumb bthumb4"></div>
                </div>
              </div>
            </div>
          
          <div className={`tools-overview ${project.events.length>0?'':'empty'}`}>
            <DashboardEvents project={project} />
            <div className="financials-overview">
              <DashboardPayments project={project} />
            </div>
          </div>


        </>
      ) : (
        <>
          <CollectionsPanel {...{project,collectionId:project.collections[0]?.id}}/>
         <div className={`tools-overview ${project.events.length>0?'':'empty'}`}>
            <DashboardEvents project={project} />
            <div className={`section financials-overview ${project.payments.length > 0 ? 'has-payments' : ''}`}>
              <DashboardPayments project={project} />
            </div>
          </div>
        </>
      ))
      :<>
      <AddProjectModal />
        <DashboardTabs project={project} />
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

      
    </>
  )
}

export default DashboardProjects
// Line Complexity  1.0 -> 