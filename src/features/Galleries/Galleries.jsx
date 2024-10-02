import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCollectionById } from '../../utils/CollectionQuery';
// Components
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import ShareGallery from '../../components/Modal/ShareGallery'
import CollectionsPanel from '../../components/Project/Collections/CollectionsPanel';
import CollectionImages from '../../components/Project/Collections/CollectionImages';
// Actions
import { deleteProject, selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';

import './Galleries.scss';
import { selectStudio, setAvailableStortage } from '../../app/slices/studioSlice';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';

export default function Galleries({}) {
  const dispatch= useDispatch();
  const defaultStudio = useSelector(selectUserStudio)
  const domain = useSelector(selectDomain)
  const navigate = useNavigate();
  let { studioName, id,collectionId } = useParams();
  // State
  const projects = useSelector(selectProjects)
  const [project, setProject] = useState(undefined)
  const [collection, setCollection] = useState('')
  const [targetCollectionId, setTargetCollectionId] = useState('')
  const [confirmDeleteProject,setConfirmDeleteProject] = useState(false)
  // Delete Project Modal
  const onDeleteConfirmClose = () => setConfirmDeleteProject(false)
  const onDeleteConfirm = () => dispatch(deleteProject(id))

  useEffect(() => {
    // If no projects are available, return early
    if (!projects) return;
    // Find the project with the given id
    setProject(projects.find((p) => p.id === id))
    // If the project is not found, redirect to the projects page and return
    let projectTemp=projects.find((p) => p.id === id)
    if (!projectTemp) {
      setTimeout(()=>{
        navigate(`/${defaultStudio.domain}/projects`);
      },100)
      return;
    }  
    

  // Determine the collectionId to use
  const defaultCollectionId = projectTemp?.collections && (projectTemp.collections.length > 0 ? projectTemp.collections[0].id : '');

  setTargetCollectionId(collectionId || defaultCollectionId)
  setCollection(findCollectionById(projectTemp, collectionId || defaultCollectionId))
 // If the collection is not found, redirect to the project page and return
 if (defaultCollectionId==='Collection not found' && defaultCollectionId!=='') {
  setTimeout(()=>{navigate(`/${defaultStudio.domain}/gallery/${id}`);},100)
  return;
}
if(!collectionId&&defaultCollectionId!==''){
  setTimeout(()=>{navigate(`/${defaultStudio.domain}/gallery/${id}/${targetCollectionId}`);},100)
  return
}
  document.title = `${projectTemp.name}'s ${projectTemp.type}`
}, [projects, id, collectionId, navigate]);

  return (
  <>
    {/* Page Header */}
    <div className="project-info">
      <div className="breadcrumbs">
        <Link className="back highlight" to={`/${domain}/project/${encodeURIComponent(id)}`}>{project?.name}</Link>
      </div>
      <div className="client">
        <h1>{collection.name}</h1>
        <div className="type"></div>
      </div>
      <div className="project-options">
        <div className="button secondery pin" 
          onClick={()=>{}} 
          >PIN : {project?.pin}
        </div>
        <div className="button primary share" onClick={()=>dispatch(openModal('shareGallery'))} target="_blank">Share</div>
      </div>
    </div>
    {/* Page Main */}
    <main className='project-page gallery-page'>
      {
        project?.collections && project.collections.length !== 0 && (
          <div className="project-collections">
            <CollectionsPanel {...{project,collectionId:targetCollectionId}}/>
            <CollectionImages   {...{ id, collectionId:targetCollectionId,project}} />
          </div>
        )
      }
      <AddCollectionModal project={project}/>
      <ShareGallery   project={project} />
      {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm} onClose={onDeleteConfirmClose}/>:''}
    </main>
    
  </>
  )}
  // Line Complexity  2.0 -> 1.8 -> 1.1 -> 1.0