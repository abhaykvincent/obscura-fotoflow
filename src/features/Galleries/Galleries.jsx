import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCollectionById } from '../../utils/CollectionQuery';
import { deleteProject, selectProjects } from '../../app/slices/projectsSlice';

import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import ShareGallery from '../../components/Modal/ShareGallery'
import CollectionImages from '../../components/Project/Collections/CollectionImages';

import './Galleries.scss';
import { openModal } from '../../app/slices/modalSlice';

export default function Galleries({setUploadList,setUploadStatus}) {
  const projects = useSelector(selectProjects)
  const dispatch= useDispatch();
  const navigate = useNavigate();
  // Route Params
  let { id,collectionId } = useParams();
  // Delete Project Modal
  const[confirmDeleteProject,setConfirmDeleteProject] = useState(false)
  const onDeleteConfirmClose = () => setConfirmDeleteProject(false)
  const onDeleteConfirm = () => dispatch(deleteProject(id))

  // If no projects are available, return early
  if (!projects) return;
  // Find the project with the given id
  const project = projects.find((p) => p.id === id);
  console.log(project)
  // If the project is not found, redirect to the projects page and return
  if (!project) {
    setTimeout(()=>{
      navigate('/projects');
    },100)
    return;
  }
  else{
  document.title = `${project.name}'s ${project.type}`
  }

  // Determine the collectionId to use
  const defaultCollectionId = project.collections.length > 0 ? project.collections[0].id : '';
  const targetCollectionId = collectionId || defaultCollectionId;
  let collection = findCollectionById(project, targetCollectionId);
  // If the collection is not found, redirect to the project page and return
  if (collection==='Collection not found' && defaultCollectionId!=='') {
    setTimeout(()=>{
    navigate(`/project/${id}`);
    },100)
    return;
  }
  if(!collectionId&&defaultCollectionId!==''){
    setTimeout(()=>{
    navigate(`/project/galleries/${id}/${targetCollectionId}`);
    },100)
    return
  }
  const findIndexofCollection = (collectionId) => {
    return project.collections.findIndex((collection) => collection.id === collectionId);
  }
  const index = findIndexofCollection(targetCollectionId);
  const activeBox = document.querySelector('.active-box');
  if (activeBox) {
    activeBox.style.left = `${(index) * 8*27.2 + 8*4}px`;
  }
  return (
  <>
    <main className='project-page gallery-page'>
      {project.collections.length === 0 ? (
        <>  
          <div className="button secondary add-collection"
            onClick={() => {
              dispatch(openModal('createCollection'))}}
            >Add Collection</div>
          <div className="no-items no-collections">Create a collection</div>
        </>
      ) : (
        <div className="project-collections">
          <div className="galleries">
            <div className="list">
            {
              project.collections.length > 0 ? 
              <div className="gallery-list">
                {project.collections.map((collection) => (
                  
                  collection.pin=="" ?
                  <div className={`gallery  no-images `} key={collection.id} onClick={()=>{}}>
                    <div className="thumbnails">
                      <div className="thumbnail thumb1">
                        <div className="backthumb bthumb1"></div>
                        <div className="backthumb bthumb2"></div>
                        <div className="backthumb bthumb3"></div>
                      </div>
                      
                    </div>
                    <div className="gallery-name">Upload Photos</div>
                    
                  </div>
                  : <Link className={`gallery ${collectionId===collection.id && 'active'}`} to={`/project/galleries/${id}/${collection.id}`}>
                      <div className="thumbnails">
                        <div className="thumbnail thumb1">
                          <div className="backthumb bthumb1"
                          style={
                            { 
                              backgroundImage: 
                              `url(${project.projectCover!=""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`,
                              backgroundSize:`${project.projectCover!=""?'':'50%'}`

                            }}
                          ></div>
                          <div className="backthumb bthumb2"></div>
                          <div className="backthumb bthumb3"></div>
                        </div>
                        <div className="thumbnail thumb2">
                          <div className="backthumb bthumb1"style={{ 
                              backgroundImage: `url(${project.projectCover!==""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`,
                              backgroundSize:`${project.projectCover!=""?'':'50%'}`
                            }}>
                          </div>
                          <div className="backthumb bthumb2"></div>
                          <div className="backthumb bthumb3"></div>
                        </div>
                        <div className="thumbnail thumb3">
                          <div className="backthumb bthumb1 count">{project.uploadedFilesCount } Photos</div>
                          <div className="backthumb bthumb2"></div>
                          <div className="backthumb bthumb3"></div>
                        </div>
                      </div>
                      <div className="gallery-name">{collection.name}</div>
                    </Link>

                  
                ))}
                <div className="active-box box"></div>
              </div>:''
            }
              <div className="gallery new" 
                onClick={() => dispatch(openModal('createCollection'))}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                    <div className="backthumb bthumb1"></div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                    <div className="backthumb bthumb4"></div>
                  </div>
                </div>
                <div className="gallery-name">New Gallery</div>
              </div>
            </div>
          </div>
          <CollectionImages  {...{ id, collectionId:targetCollectionId,collection,setUploadList,setUploadStatus}} />
        </div>
      )}
      <AddCollectionModal project={project}/>
      <ShareGallery   project={project} />
      {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm} onClose={onDeleteConfirmClose}/>:''}
    </main>
    <div className="project-info">
      <div className="breadcrumbs">
        <Link className="back " to={`/projects`}>Project </Link>
        <Link className="back highlight" to={`/project/${encodeURIComponent(id)}`}>{project.name}</Link>
      </div>
      <div className="client">
        <h1>{collection.name}</h1>
        <div className="type"></div>
      </div>
      <div className="project-options">
        <div className="button primary share" /* href={`/share/${id}`} */onClick={()=>dispatch(openModal('shareGallery'))} target="_blank">Share</div>
      </div>
    </div>
  </>
  )}
  // Line Complexity  2.0 -> 1.5