import React, { useEffect, useState } from 'react';
import { addCollection } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import { selectCollectionsLimit, selectStudio } from '../../app/slices/studioSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { trackEvent } from '../../analytics/utils';

function AddCollectionModal({ project }) {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const visible = useSelector(selectModal)
  const defaultStudio = useSelector(selectUserStudio)
  const collectionsLimit ={
    perProject: 3
  }
  let collectionsLength= project?.collections?project.collections:0
  const [CollectionData, setCollectionData] = useState({
    name: '',
    status: 'empty',
    images: [],
    imagesUrl: []
  });
  const onClose = () => dispatch(closeModal('createCollection'))
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCollectionData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = () => {
  if (isSubmitting) return;  // Prevent multiple submissions
  setIsSubmitting(true);

  console.log('collection length' + collectionsLength.length)
  console.log(collectionsLimit)
  const domain= defaultStudio.domain;
  
  if(collectionsLength.length < collectionsLimit.perProject) {
    dispatch(addCollection({ domain, projectId: project.id, newCollection: CollectionData }))
    .then((id) => {
      console.log(id)
      trackEvent('collection_created', {
        project_id: project.id,
        collection_id: id.payload.collection.id
      });
      dispatch(showAlert({ type: 'success', message: `Collection <b>${CollectionData.name}</b> added successfully!` }));
      navigate(`/${defaultStudio.domain}/gallery/${project.id}/${id.payload.collection.id}`);
    })
    .finally(() => {
      setIsSubmitting(false);  // Re-enable the button after submission
    });
  } else {
    dispatch(showAlert({ type: 'error', message: `Project <b>${CollectionData.name}</b>'s Collection limit reached! Upgrade` }));
  }
  onClose();
};


  if (!visible.createCollection) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="modal create-project">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>onClose()}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Create Collection</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            <div className="field">
              <label className="" htmlFor="">Collection</label>
              <input className="" name="name" value={CollectionData.name} type="text" onChange={handleInputChange}/>
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={()=>onClose()}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={()=>onClose()}></div>
    </div>
  );
}

export default AddCollectionModal


function convertToSlug(inputString) {
  // Replace spaces with hyphens and convert to lowercase
  return inputString.replace(/\s+/g, '-').toLowerCase();
}