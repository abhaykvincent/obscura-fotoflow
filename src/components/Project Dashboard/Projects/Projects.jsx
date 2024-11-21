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

function DashboardProjects({project}){
  const dispatch =useDispatch()
  const navigate = useNavigate();

  const { studioName } = useParams();
  const [projectDashboardView, setProjectDashboardView] = useState('dashboard')
  // Inside your component
  return (
    <>
     <div className="project-dashboard-header">
      <div className="tools">
        
      <Link to={`/${studioName}/invitation-creator/${project.id}`}>
        <div className="button secondary  icon  invitation" > Invitation</div>
      </Link>
        <div className="button secondary icon user" >Client</div>
      </div>
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
          <div className="gallery new" 
          onClick={()=>dispatch(openModal('createCollection'))}>
            <div className="heading-section">

        <h3 className='heading'>Galleries <span>{project.collections.length}</span></h3>
            </div>
          <div className="thumbnails">
            <div className="thumbnail thumb1">
              <div className="backthumb bthumb1"
              >
          <div className="button primary outline">New Gallery</div></div>
              <div className="backthumb bthumb2"></div>
              <div className="backthumb bthumb3"></div>
              <div className="backthumb bthumb4"></div>
            </div>
          </div>
          
        </div>


        <div className="financials-overview">
      <DashboardPayments project={project} />
      <DashboardExpances project={project} />
      </div>
      <DashboardEvents project={project} />
      </>
      
    ) : (
      <>
      <div className="gallery-overview">
        <div className="galleries">
          <div className="heading-shoots heading-section">
            <h3 className='heading '>Galleries <span>{project.collections.length}</span></h3>
            <div className="new-shoot button tertiary l2 outline icon new"
              onClick={ ()=>{}}>New
            </div>
          </div>
          
          <Link className={`gallery ${project.projectCover==="" && 'no-images'}`} to={`/${project.id}/gallery/${project.id}`}>
            <div className="thumbnails">
              <div className="thumbnail thumb1">
                <div className="backthumb bthumb1"
                style={
                  {
                    backgroundImage:
                    `url(${project.projectCover!==""?encodeURI(project.projectCover):'https://img.icons8.com/?size=100&id=UVEiJZnIRQiE&format=png&color=333333'})`
                  }}
                ></div>
              </div>
            </div>
          </Link>
          
          
        </div>
      </div>


      <div className="financials-overview">
      <DashboardPayments project={project} />
      <DashboardExpances project={project} />
      </div>
      <DashboardEvents project={project} />
</>
    ))
    :<>
      <DashboardTabs project={project} />
    </>
    }
    </>
  )
}

export default DashboardProjects
// Line Complexity  1.0 -> 