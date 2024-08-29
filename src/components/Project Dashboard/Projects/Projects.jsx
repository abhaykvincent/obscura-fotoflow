import React, { useState } from 'react'
import AddEventModal from '../../Modal/AddEvent'
import AddCrewModal from '../../Modal/AddCrew';
import CrewCard from '../../Cards/CrewCard/CrewCard';
import { getUserByID, teams } from '../../../data/teams';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { showAlert } from '../../../app/slices/alertSlice';

function DashboardProjects({project}){
  const dispatch =useDispatch()
  const navigate = useNavigate();
  return (
    <>
    {
      project.collections.length === 0 ? (
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
      <div className="gallery-overview">
        <div className="galleries">
          <div className="heading-shoots heading-section">
            <h3 className='heading '>Galleries <span>{project.collections.length}</span></h3>
            <div className="new-shoot button tertiary l2 outline icon new"
              onClick={ ()=>{}}>New
            </div>
          </div>
          <Link className={`gallery ${project.projectCover==="" && 'no-images'}`} to={`/obscura/gallery/${project.id}`}>
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
                
                {project.uploadedFilesCount!==0? project.uploadedFilesCount+' Photos': 'otos'}</div>
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
            <div className="button primary outline ">Share</div>
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
    )}
    </>
  )
}

export default DashboardProjects
// Line Complexity  1.0 -> 