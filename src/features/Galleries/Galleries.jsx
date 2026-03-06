import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCollectionById } from '../../utils/CollectionQuery';
// Components
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import ShareGallery from '../../components/Modal/ShareGallery'
import UploadCompletedModal from '../../components/Modal/UploadCompleted';
import OpenInDesktop from '../../components/Modal/OpenInDesktop';
import CollectionsPanel from '../../components/Project/Collections/CollectionsPanel';
import CollectionImages from '../../components/Project/Collections/CollectionImages';
// Actions
import { deleteCollection, deleteProject, selectProjects, updateCollectionName } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';

import './Galleries.scss';
import { selectStudio, setAvailableStortage } from '../../app/slices/studioSlice';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger, } from '@radix-ui/react-dropdown-menu';
import { showAlert } from '../../app/slices/alertSlice';
import { selectGalleryMode } from '../../app/slices/gallerySlice';

export default function Galleries({}) {
  const dispatch= useDispatch();
  const defaultStudio = useSelector(selectUserStudio)
  const domain = useSelector(selectDomain)
  const navigate = useNavigate();
  let { studioName, id,collectionId } = useParams();
  // State
  const projects = useSelector(selectProjects)
  const galleryMode = useSelector(selectGalleryMode);
  const [project, setProject] = useState(undefined)
  const [collection, setCollection] = useState('')
  const [targetCollectionId, setTargetCollectionId] = useState('')
  const [confirmDeleteCollection,setConfirmDeleteCollection] = useState(false)

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  // Delete Project Modal
  const onDeleteConfirmClose = () => setConfirmDeleteCollection(false)
  const onDeleteConfirm = () => dispatch(deleteCollection({domain,projectId:id,collectionId:targetCollectionId}))
  
   const handleDoubleClick = () => {
    setIsEditing(true);
    setNewName(collection.name);
  };
  const handleSave = () => {
    if (newName && newName !== collection.name) {
        dispatch(updateCollectionName({ domain, projectId:id, collectionId: collection.id, newName })).then(() => {
        setIsEditing(false);
      });
    }
  };
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
    setSelectedCount(0);
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
      document.title = `${projectTemp.name}'s ${projectTemp.type } Gallery`
    }, [projects, id, collectionId, navigate]);

    useEffect(()=>{
      console.log(targetCollectionId)
    },[targetCollectionId])

  const isArchived = project?.status === 'archive' || project?.storage?.status === 'archive';
  const isExpired = project?.status === 'expired';

  return (
  <>
    {/* Page Header */}
    <DeleteConfirmationModal itemType="collection" itemName={collection.name} onDeleteConfirm={onDeleteConfirm} />
    <OpenInDesktop selectedCount={selectedCount} />

    {createPortal(
      <div className="project-info gallery-page-info">
        <div className="breadcrumbs">
          <Link className="back highlight" to={project?.type === 'Portfolio'?`/${domain}/portfolio-editor`:`/${domain}/project/${encodeURIComponent(id)}`}>{project?.name}</Link>
        </div>
        <div className="client">
          {isEditing ? (
            <div  className="editable-data">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <div className="input-edit-actions">

                <button
                  onClick={handleSave}
                  className={`save-button ${newName === collection.name ? 'disabled' : ''}  button primary icon icon-only check`}
                  
                ></button>
                <button className="button secondary  icon icon-only close" onClick={() => setIsEditing(false)}></button>
              </div>
            </div>
          ) : (
            <h1 onClick={handleDoubleClick}><span>{collection.name}</span></h1>
          )}
          <div className="type"></div>
        </div>
        <div className={`project-options ${project?.pin?'':'disabled'}`}>
        
          <div className="button primary share" onClick={()=>
            {project?.pin 
              ? dispatch(openModal('shareGallery'))
              : dispatch(showAlert({
                type:'error',
                message:'Upload Images and Refresh the page',
                
              }
              ))
            }
          } target="_blank">Share</div>


          <DropdownMenu>
            <DropdownMenuTrigger >
              <div className="icon options"></div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                onSelect={() => {
                  if (!isArchived && !isExpired) {
                    dispatch(openModal('createCollection'));
                  }
                }}
                disabled={isArchived || isExpired}
                >
                  <div className="icon-show add"></div>
                  New Gallery</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    // Your action for Delete
                    dispatch(openModal('confirmDeletecollection'));
                  }}
                >
                  <div className="icon-show delete"></div>
                  Delete Gallery
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => { handleDoubleClick()}}>
                  <div className="icon-show edit"></div>
                  Edit Gallery name
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>,
      document.getElementById('header-feature-content') || document.body
    )}

    <AddCollectionModal project={project} />
    <ShareGallery   project={project} />
    <UploadCompletedModal project={project} collectionName={collection?.name} />

    {/* Page Main */}
    <main className={`gallery-page ${galleryMode === 'designMode' ? 'designMode' : ''}`}>
      {
        project?.collections && project.collections.length !== 0 && (
          <div className="project-collections" tabIndex={0}>
            <CollectionsPanel {...{project,collectionId:targetCollectionId}}/>
            <CollectionImages   {...{ id, collectionId:targetCollectionId,project, setSelectedCount }} />
          </div>
        )
      }
    </main>
    
  </>
  )}
  // Line Complexity  2.0 -> 1.8 -> 1.1 -> 1.0