import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { findCollectionById } from '../../utils/CollectionQuery';
// Components
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import ShareGallery from '../../components/Modal/ShareGallery'
import CollectionImages from '../../components/Project/Collections/CollectionImages';
// Actions
import { deleteProject, selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';

import './Galleries.scss';
import ProjectCollections from '../../components/Project/Collections/CollectionsPanel';

export default function Galleries({setUploadList,setUploadStatus}) {
  const dispatch= useDispatch();
  const navigate = useNavigate();
  let { id,collectionId } = useParams();
  // State
  const projects = useSelector(selectProjects)
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
  document.title = `${project.name}'s ${project.type}`
  

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
    {/* Page Header */}
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
        <div className="button secondery pin" 
          onClick={()=>{}} 
          >PIN : {project.pin}
        </div>
        <div className="button primary share" onClick={()=>dispatch(openModal('shareGallery'))} target="_blank">Share</div>
      </div>
    </div>
    {/* Page Main */}
    <main className='project-page gallery-page'>
      {
      project.collections.length === 0 ? (
      <>  
        <div className="button secondary add-collection"
          onClick={() => {
            dispatch(openModal('createCollection'))}}
          >Add Collection</div>
        <div className="no-items no-collections">Create a collection</div>
      </>) 
      : (
        <div className="project-collections">
          <ProjectCollections {...{project,collectionId:targetCollectionId}}/>
          <CollectionImages  {...{ id, collectionId:targetCollectionId,collection,setUploadList,setUploadStatus}} />
        </div>
      )}
      <AddCollectionModal project={project}/>
      <ShareGallery   project={project} />
      {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm} onClose={onDeleteConfirmClose}/>:''}
    </main>
    
  </>
  )}
  // Line Complexity  2.0 -> 1.8 -> 1.1