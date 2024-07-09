import React, { useEffect, useState } from 'react';
import { addCollection } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

function AddCollectionModal({ project, visible, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const [CollectionData, setCollectionData] = useState({
    name: 'Birthday',
    status: 'empty',
    images: [],
    imagesUrl: []
  });
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCollectionData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
  };
  const handleSubmit = () => {
    dispatch(addCollection({ projectId: project.id, newCollection: CollectionData }))
    .then((id)=>{
      dispatch(showAlert({type:'success', message:`Collection <b>${CollectionData.name}</b> added successfully!`}));
      console.log(id.payload);
      setTimeout(()=>{
        navigate(`/project/galleries/${project.id}/${id.payload}`);
      },100)
    })
    onClose('createCollection');
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="modal create-project">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>onClose('createCollection')}></div>
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
          <div className="button secondary" onClick={()=>onClose('createCollection')}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={()=>onClose('createCollection')}></div>
    </div>
  );
}

export default AddCollectionModal


function convertToSlug(inputString) {
  // Replace spaces with hyphens and convert to lowercase
  return inputString.replace(/\s+/g, '-').toLowerCase();
}