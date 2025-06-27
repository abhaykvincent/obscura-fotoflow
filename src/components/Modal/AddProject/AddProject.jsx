import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Redux
import { showAlert } from '../../../app/slices/alertSlice';
import { addProject, createSubProject } from '../../../app/slices/projectsSlice';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { selectUser, selectUserStudio } from '../../../app/slices/authSlice';
import { createNotification } from '../../../app/slices/notificationSlice';
// Hooks
import { useModalFocus } from '../../../hooks/modalInputFocus';
// Components
import TemplateSelection from './TemplateSelection';
// Utils
import { validateForm } from './validation';
import { initialProjectData, VALIDITY_OPTIONS } from './constants';



function AddProjectModal({ isSubProject = false, parentProjectId = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);
  const user = useSelector(selectUser);

  const [projectData, setProjectData] = useState(initialProjectData);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const nameInputRef = useRef(null);
  const name2InputRef = useRef(null);
  const typeInputRef = useRef(null);
  const modalRef = useModalFocus(visible.createProject);

  const onClose = () => dispatch(closeModalWithAnimation("createProject"));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProjectData((prevData) => ({ ...prevData, [name]: value, 
      createdAt: new Date().getTime() }));
  };

  const dispatchNotification = (response, user) => {
    dispatch(
      createNotification({
        studioId: currentStudio.domain,
        notificationData: {
          title: response.payload.name,
          message: `A new project was successfully created`,
          type: 'project',
          actionLink: '/projects',
          priority: 'normal',
          isRead: false,
          metadata: {
            createdAt: new Date().toISOString(),
            eventType: 'project_created',
            createdBy: user.email,
            projectName: 'Project Name',
            authMethod: 'google',
          },
        },
      })
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !projectData.type.trim()) {
      setErrors({ type: "Project type is required" });
      typeInputRef.current?.focus(); // Focus the type input if it’s empty
      return;
    }
    setCurrentStep(currentStep + 1);
    setTimeout(() => {
      nameInputRef.current?.focus(); // Focus the first input in step 2
    }, 0);
  };
  
  const handleSubmit = () => {
    if (!validateForm(projectData, setErrors, nameInputRef, name2InputRef, typeInputRef)) {
      // Focus the first input with an error
      if (errors.name) {
        nameInputRef.current?.focus();
      } else if (errors.name2) {
        name2InputRef.current?.focus();
      }
      return;
    }
  
    const domain = currentStudio.domain;
    onClose();
  
    setTimeout(() => {
      const action = isSubProject && parentProjectId
        ? dispatch(createSubProject({ domain, parentProjectId, subProjectData: projectData }))
        : dispatch(addProject({ domain, projectData }));
  
      action
        .then((response) => {
          const { id, subProjectId } = response.payload;
          dispatch(showAlert({ type: "success", message: `${isSubProject ? "Sub-Project" : "Project"} created successfully!` }));
          dispatchNotification(response, user);
          navigate(`/${domain}/project/${isSubProject ? `${parentProjectId}/sub-project/${subProjectId}` : id}`);
        })
        .catch((error) => {
          console.error(`Error creating ${isSubProject ? "sub-project" : "project"}:`, error);
          dispatch(showAlert({ type: "error", message: `Failed to create ${isSubProject ? "sub-project" : "project"}.` }));
        });
    }, 500);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (!visible.createProject) return null;

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal create-project island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">
            {currentStep === 1 ? "Create project" : currentStep === 2 ? "Project Details" : isSubProject ? "New Sub-Project" : "New Project"}
            <p className="modal-subtitle">
              {currentStep === 1 ? "Choose Template" : currentStep === 2 ? projectData.type : isSubProject ? "New Sub-Project" : "New Project"}
            </p>
          </div>
        </div>
        <div className="modal-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 1) {
                handleNextStep();
              } else if (currentStep === 2) {
                handleSubmit();
              }
            }}
          >
            {currentStep === 1 && (
              <TemplateSelection
                projectData={projectData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleNextStep={handleNextStep}
                typeInputRef={typeInputRef} // Pass the ref to TemplateSelection
              />
            )}
            {currentStep === 2 && (
              <ProjectDetails
                projectData={projectData}
                errors={errors}
                handleInputChange={handleInputChange}
                nameInputRef={nameInputRef}
                name2InputRef={name2InputRef}
              />
            )}
          </form>
        </div>
        <div className="actions">
          {currentStep === 1 && (
            <button className="button secondary" onClick={onClose}>Cancel</button>
          )}
          {currentStep > 1 && (
            <button className="button secondary" onClick={handlePreviousStep}>Back</button>
          )}
          {currentStep < 2 ? (
            <button className="button primary" onClick={handleNextStep}>Next</button>
          ) : (
            <button className="button primary" onClick={handleSubmit}>
              {isSubProject ? "Create Sub-Project" : "Create Project"}
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}


const ProjectDetails = ({ projectData, errors, handleInputChange, nameInputRef, name2InputRef }) => (
  <div className="form-section">
    {projectData.type === 'Wedding' ? (
      <>
        <div className="field">
          <label>Groom</label>
          <input
            name="name"
            ref={nameInputRef}
            value={projectData.name}
            placeholder="Sarah"
            type="text"
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && projectData.name.trim()) {
                e.preventDefault();
                name2InputRef.current?.focus();
              }
            }}
          />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>
        <div className="field">
          <label>Bride</label>
          <input
            name="name2"
            ref={name2InputRef}
            value={projectData.name2}
            placeholder="Matan"
            type="text"
            onChange={handleInputChange}
          />
          {errors.name2 && <div className="error">{errors.name2}</div>}
        </div>
      </>
    ) : (
      <div className="field">
        <label>Project Name</label>
        <input
          name="name"
          ref={nameInputRef}
          value={projectData.name}
          placeholder="Sarah & Matan"
          type="text"
          onChange={handleInputChange}
        />
        {errors.name && <div className="error">{errors.name}</div>}
      </div>
    )}
    <div className="field">
      <label>Validity</label>
      <div className="project-validity-wrap">
        <div className="project-validity-options">
          {VALIDITY_OPTIONS.map(({ id, value, label, disabled, className }) => (
            <div className={`radio-button-group ${className}`} key={id}>
              <input
                type="radio"
                id={id}
                name="projectValidityMonths"
                value={value}
                checked={projectData.projectValidityMonths === value}
                onChange={handleInputChange}
                disabled={disabled}
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>
        <div className="info">
           Storage frees up & archived for future access.
        </div>
      </div>
    </div>
  </div>
);

export default AddProjectModal;