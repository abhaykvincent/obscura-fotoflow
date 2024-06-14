import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCollectionById } from '../../utils/CollectionQuery';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import CollectionsPanel from '../../components/Project/Collections/CollectionsPanel';
import CollectionImages from '../../components/Project/Collections/CollectionImages';

import './Galleries.scss';
export default function Galleries({ projects,  addCollection, deleteCollection, deleteProject,setUploadList,setUploadStatus,showAlert}) {
  const navigate = useNavigate();
  // Route Params
  let { id,collectionId } = useParams();
  // Modal
  const [modal, setModal] = useState({createCollection: false})
  const openModal = () => setModal({ createCollection: true });
  const closeModal = () => setModal({ createCollection: false });
  // Delete Project Modal
  const[confirmDeleteProject,setConfirmDeleteProject] = useState(false)
  const onDeleteConfirmClose = () => setConfirmDeleteProject(false)
  const onDeleteConfirm = () => deleteProject(id);

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

  return (
    <main className='project-page'>
      <div className="project-info">
      <div className="client">
          <Link className="back" to={`/project/${id}}`}></Link>
          <h1>{project.name}</h1>
          <div className="type">{project.type}</div>
        </div>
        <div className="project-options">
          <a className="button primary share" href={`/share/${id}`} target="_blank">Share</a>
          <a className="button primary selection" href={`/selection/${id}`} target="_blank">Selection</a>
          <div className="button warnning" onClick={()=>{
            setConfirmDeleteProject(true)
          }}>Delete</div>
        </div>
        <div className="client-contact">
          <p className="client-phone">{project.phone}</p>
          <p className="client-email">{project.email}</p>
        </div>
        <div className="project-options">PIN 
          {/* display project pin and a click buttion to copy to clicp board */}
          <div className="button secondary pin" onClick={()=>{
            navigator.clipboard.writeText(`${project.pin}`)
            showAlert('success', 'Pin copied to clipboard!')
          }}>{project.pin}</div>
        </div>
      </div>
      {project.collections.length === 0 ? (
        <>  
          <div className="button secondary add-collection"
                onClick={openModal}
                >Add Collection</div>
        <div className="no-items no-collections">Create a collection</div>
        </>
      ) : (
        <div className="project-collections">
          <div className="galleries">
        <h2>Galleries</h2>

        <div className="list">
        {
          project.collections.length > 0 ? 
          <div className="gallery-list">
            {project.collections.map((collection) => (
              <Link className="gallery" to={`/project/galleries/${id}/${collection.id}`}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                    <div className="backthumb bthumb1"
                    style={
                      { 
                        backgroundImage: 
                          `url(${project.projectCover?project.projectCover:''})`
                      }}
                    ></div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                  <div className="thumbnail thumb2">

                    <div className="backthumb bthumb1">
                    </div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                    </div>
                  <div className="thumbnail thumb3">

                      <div className="backthumb bthumb1 count">
                      1265 Photos</div>
                      <div className="backthumb bthumb2"></div>
                      <div className="backthumb bthumb3"></div>
                    </div>
                </div>
                <div className="gallery-name">{collection.name}</div>
                
              </Link>
            ))}

        
          </div>:''
        }
        <div className="gallery new" 
          onClick={openModal}>
           <div className="thumbnails">
             <div className="thumbnail thumb1">
               <div className="backthumb bthumb1"
               ></div>
               <div className="backthumb bthumb2"></div>
               <div className="backthumb bthumb3"></div>
               <div className="backthumb bthumb4"></div>
             </div>
           </div>
           <div className="gallery-name">New Gallery</div>
           
         </div>
        </div>
      </div>
          <CollectionsPanel {...{project, collectionId:targetCollectionId, deleteCollection, openModal}}/>
          <CollectionImages  {...{ id, collectionId:targetCollectionId,collection,setUploadList,setUploadStatus,showAlert}} />
        </div>
      )}

      


      <AddCollectionModal project={project} visible={modal.createCollection} onClose={closeModal} onSubmit={addCollection}  />
      {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm} onClose={onDeleteConfirmClose}/>:''}
    </main>
  )
  }