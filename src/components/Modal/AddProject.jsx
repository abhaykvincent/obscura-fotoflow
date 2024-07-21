import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addProject } from '../../app/slices/projectsSlice';
import { useNavigate } from 'react-router';
import { closeModal, selectModal } from '../../app/slices/modalSlice';

function AddProjectModal() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const visible = useSelector(selectModal)
    console.log(visible)
    const onClose = () => dispatch(closeModal('createProject'))
  const [projectData, setProjectData] = useState({
      name: 'Ethan Ross',
      type: 'Birthday',
      email: 'julia.ethan@gmail.com',
      phone: '3656992278',
      collections: [],
      events: [],
      payments: [],
      status: 'draft',
      projectCover:'',
      uploadedFilesCount:0,
      selectedFilesCount:0,
      totalFileSize:0,
      createdAt: new Date().getTime(),
      lastOpened: new Date().getTime(),
  });
  const handleInputChange = (event) => {
      const {name,value} = event.target;
      setProjectData((prevData) => ({
          ...prevData,
          [name]: value,
      }));
  };
  const handleSubmit = () => {
      // Call the API function to add a new project
      
      dispatch(addProject(projectData))
          .then((response) => {
            let newProjectData = response.payload;
              onClose();
              dispatch(showAlert({type:'success', message:`New Project created!`}));
            
              navigate(`/project/${newProjectData.id}`);
          })
          .catch((error) => {
              console.error('Error creating project:', error);
              dispatch(showAlert({type:'error', message:`error`}));
              // Handle error scenarios, e.g., show an error message
          });
  };


  if (!visible.createProject) {
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
                <div className="modal-title">Create Project</div>
            </div>
            <div className='modal-body'>
                <div className="form-section">
                    <div className="field">
                        <label className="" htmlFor="">Project Name</label>
                        <input className="" name="name" value={projectData.name} type="text"
                            onChange={handleInputChange} />
                    </div>
                    <div className="field">
                        <label className="" htmlFor="">Project Type</label>
                        <input className="" name="type" value={projectData.type} type="text"
                            onChange={handleInputChange} />
                    </div>
                </div>
                <div className="form-section contact">
                    <div className="field">
                        <label className="" htmlFor="">Email</label>
                        <input className="" name="email" value={projectData.email} type="text"
                            onChange={handleInputChange} />
                    </div>
                    <div className="field">
                        <label className="" htmlFor="">Phone</label>
                        <input className="" name="phone" value={projectData.phone} type="text"
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

export default AddProjectModal
// Line Complexity  1.0 ->