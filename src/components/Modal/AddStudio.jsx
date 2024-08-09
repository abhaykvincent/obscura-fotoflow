import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addProject } from '../../app/slices/projectsSlice';
import { useNavigate } from 'react-router';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { selectCreateStudioModal, selectUserStudio } from '../../app/slices/authSlice';
import { createStudio } from '../../firebase/functions/firestore';

function AddStudio() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const defaultStudio = useSelector(selectUserStudio)
    const visible = useSelector(selectCreateStudioModal)
    console.log(visible)
    const onClose = () => dispatch(closeModal('createStudio'))
  const [studioData, setStudioData] = useState({
      name: 'Sixty Frames',
      domain: 'sixty-frames',
  });
  const handleInputChange = (event) => {
      const {name,value} = event.target;
      setStudioData((prevData) => ({
          ...prevData,
          [name]: value,
      }));
  };
  const handleSubmit = () => {
      // Call the API function to add a new project
      
      createStudio(studioData)
          .then((response) => {
            let newStudioData = response.payload;
              onClose();
              dispatch(showAlert({type:'success', message:`New Project created!`}));
            
              navigate(`/${studioData.id}`);
          })
          .catch((error) => {
              console.error('Error creating project:', error);
              dispatch(showAlert({type:'error', message:`error`}));
              // Handle error scenarios, e.g., show an error message
          });
  };


  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container">
        <div className="modal create-project">
            <div className='modal-header'>
                <div className="modal-controls">
                    <div className="control close" onClick={onClose}></div>
                    <div className="control minimize"></div>
                    <div className="control maximize"></div>
                </div>
                <div className="modal-title">New Studio</div>
            </div>
            <div className='modal-body'>
                <div className="form-section">
                    <div className="field">
                        <label className="" htmlFor="">Studio Name</label>
                        <input className="" name="name" value={studioData.name} type="text"
                            onChange={handleInputChange} />
                    </div>
                    <div className="field">
                        <label className="" htmlFor="">Studio id</label>
                        <input className="" name="domain" value={studioData.domain} type="text"
                            onChange={handleInputChange} />
                    </div>
                </div>
            </div>
            <div className="actions">
                <div className="button secondary" onClick={onClose}>Cancel</div>
                <div className="button primary" onClick={handleSubmit}>Create</div>
            </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddStudio
// Line Complexity  1.0 ->