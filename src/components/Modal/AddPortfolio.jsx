import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import { addProject } from '../../app/slices/projectsSlice';
import { useNavigate } from 'react-router';
import { closeModal, closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { trackEvent } from '../../analytics/utils';
import { analytics } from '../../firebase/app';
import { logEvent } from 'firebase/analytics';
import { sendEmailNotification } from '../../utils/Notification/sendEmailNotification';
import { useModalFocus } from '../../hooks/modalInputFocus';

function AddPortfolioModal() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const visible = useSelector(selectModal)
    const currentStudio = useSelector(selectUserStudio)
    const onClose = () => dispatch(closeModalWithAnimation('createPortfolio'))
    // Dummny datas for the new project for random data
   
    if (process.env.NODE_ENV === 'development') {
        console.log('DEV MODE');
        window.firebase = window.firebase || {};  // for debugging
        window.firebase.DEBUG = true;  // Enable verbose logging
    }
  const [projectData, setProjectData] = useState({
      name:currentStudio.name ,
      type: 'Portfolio',
      collections: [],
      events: [],
      payments: [],
      expenses: [],
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
      
            // get the route url and take out between first and second /
            /* const url = window.location.href;
            const parts = url.split('/');
            const domain = parts[3];
            console.log(domain,projectData) */

            onClose();
            const domain = currentStudio.domain;
            //delat 500ms
            setTimeout(() => {
           
            dispatch(addProject({domain,projectData}))
          .then((response) => {
            let newProjectData = response.payload;
            console.log(response)
              
              // trigger analytics event  project_created
              trackEvent('project_created', {
                project_type: newProjectData.type,
                project_email: newProjectData.email,
              });

              dispatch(showAlert({type:'success', message:`New Project created!`}));
                sendEmailNotification(
                    "abhaykvincent@gmail.com",
                    "Photography ",
                    "Test"
            )
              navigate(`/${domain}/project/${newProjectData.id}`);
          })
          .catch((error) => {
              console.error('Error creating project:', error);
              dispatch(showAlert({type:'error', message:`error`}));
              // Handle error scenarios, e.g., show an error message
          });
        }, 500);
  };


  const modalRef = useModalFocus(visible.createPortfolio);
  if (!visible.createPortfolio) {
      return null;
    }
    
    return (
        <div className="modal-container"
        ref={modalRef} 
    
    >
        <div className="modal create-project">
            <div className='modal-header'>
                <div className="modal-controls">
                    <div className="control close" onClick={onClose}></div>
                    <div className="control minimize"></div>
                    <div className="control maximize"></div>
                </div>
                <div className="modal-title">Create Portfolio</div>
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

export default AddPortfolioModal
// Line Complexity  1.0 ->