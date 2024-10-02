import React, { useState } from 'react'
import AddEventModal from '../../Modal/AddEvent'
import AddCrewModal from '../../Modal/AddCrew';
import CrewCard from '../../Cards/CrewCard/CrewCard';
import { getUserByID, teams } from '../../../data/teams';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { showAlert } from '../../../app/slices/alertSlice';
import DashboardPayments from '../Payments/Payments';
import DashboardExpances from '../Expances/Expances';
import DashboardEvents from '../Events/Events';
import DashboardTabs from './DashboardTabs/DashboardTabs';

function DashboardProjects({project}){
  const dispatch =useDispatch()
  const navigate = useNavigate();
  const [projectDashboardView, setProjectDashboardView] = useState('dashboard')
  return (
    <>
     <div className="project-dashboard-header">
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
                    `url(${project.projectCover!==""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`
                  }}
                ></div>
                <div className="backthumb bthumb2"></div>
                <div className="backthumb bthumb3"></div>
              </div>
              <div className="thumbnail thumb2">
                <div className="backthumb bthumb1 count"style={
                  {
                    backgroundImage:
                      `url(${project.projectCover?project.projectCover:''})`
                }}></div>
                <div className="backthumb bthumb2"></div>
                <div className="backthumb bthumb3"></div>
              </div>
              <div className="thumbnail thumb3">
                <div className="backthumb bthumb1 count" style={
                {
                  backgroundImage:
                    `url(${project.projectCover?project.projectCover:''})`
                }}>
                
                {project.uploadedFilesCount!==0? project.uploadedFilesCount+' Photos': '0 Photos'}</div>
                <div className="backthumb bthumb2"></div>
                <div className="backthumb bthumb3"></div>
              </div>
            </div>
          </Link>
          {
            project.pin?
            <div className="ctas">
            <div className="button secondary outline bold pin " onClick={()=>{
              navigator.clipboard.writeText(`${project.pin}`)
              showAlert('success', 'Pin copied to clipboard!')
            }}>PIN: {project.pin}</div>
            <div className="button primary outline " onClick={()=>dispatch(openModal('shareGallery'))}>Share</div>
          </div>
            :
            <div className="ctas">
            <div className="button primary  bold pin " onClick={()=>{
              //go to project/collection
              //`/moalisa/gallery/${project.id}/${project.collections[0].id}` with react naigate
              navigate(`/monalisa/gallery/${project.id}/${project.collections[0].id}`)
            }}>Upload Images</div>
            <div className="button secondary outline disabled ">Share</div>
          </div>
          }
          
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