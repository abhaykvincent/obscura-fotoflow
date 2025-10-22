import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Redux
import { showAlert } from '../../../app/slices/alertSlice';
import { addProject, createSubProject } from '../../../app/slices/projectsSlice';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { selectUser, selectUserStudio } from '../../../app/slices/authSlice';
import { createNotification } from '../../../app/slices/notificationSlice';
import { showLoading, hideLoading } from '../../../app/slices/loadingSlice';
// Hooks
import { useModalFocus } from '../../../hooks/modalInputFocus';
// Components
import TemplateSelection from './TemplateSelection';
import ProjectDetails from './ProjectDetails';
// Utils
import { validateForm } from './validation';
import { initialProjectData } from './constants';
import './AddProject.scss';

function AddProjectModal({ isSubProject = false, parentProjectId = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createProject: isVisible } = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);
  const user = useSelector(selectUser);

  const [projectData, setProjectData] = useState({ ...initialProjectData });
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const { show: isLoading } = useSelector((state) => state.loading);

  const nameInputRef = useRef(null);
  const name2InputRef = useRef(null);
  const typeInputRef = useRef(null);
  const modalRef = useModalFocus(isVisible);

  const onClose = () => dispatch(closeModalWithAnimation("createProject"));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProjectData((prevData) => ({
      ...prevData,
      [name]: value,
      createdAt: new Date().getTime(),
    }));
  };

  const dispatchNotification = (payload, user) => {
    dispatch(
      createNotification({
        studioId: currentStudio.domain,
        notificationData: {
          title: payload.name,
          message: `A new project was successfully created`,
          type: 'project',
          actionLink: '/projects',
          priority: 'normal',
          isRead: false,
          metadata: {
            createdAt: new Date().toISOString(),
            eventType: 'project_created',
            createdBy: user.email,
            projectName: payload.name,
            authMethod: 'google',
          },
        },
      })
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !projectData.type.trim()) {
      setErrors({ type: "Project type is required" });
      typeInputRef.current?.focus();
      return;
    }
    setCurrentStep(currentStep + 1);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const handleSubmit = async () => {
    if (!validateForm(projectData, setErrors, nameInputRef, name2InputRef, typeInputRef)) {
      if (errors.name) nameInputRef.current?.focus();
      else if (errors.name2) name2InputRef.current?.focus();
      return;
    }
const domain = currentStudio.domain;
    dispatch(showLoading('Creating project..'));
    onClose();

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for animation

    const projectType = isSubProject ? "Sub-Project" : "Project";
    const action = isSubProject && parentProjectId
      ? createSubProject({ domain, parentProjectId, subProjectData: projectData })
      : addProject({ domain, projectData });

    try {
      const response = await dispatch(action);
      const payload = response.payload;
      dispatchNotification(payload, user);
      dispatch(showAlert({ type: "success", message: `${projectType} created successfully!` }));

      const { id, subProjectId } = payload;
      const navigateTo = isSubProject ? `${parentProjectId}/sub-project/${subProjectId}` : id;
      console.log(`/${domain}/project/${navigateTo}`)

      dispatch(hideLoading());
      navigate(`/${domain}/project/${navigateTo}`);
    } catch (error) {
      console.error(`Error creating ${projectType.toLowerCase()}:`, error);
      dispatch(showAlert({ type: "error", message: `Failed to create ${projectType.toLowerCase()}.` }));
      dispatch(hideLoading());
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getModalTitle = () => {
    if (currentStep === 1) return "Choose template";
    return isSubProject ? "New Sub-Project" : "Project Details";
  };

  const getModalSubtitle = () => {
    if (currentStep === 1) return "New project";
    return projectData.type || (isSubProject ? "New Sub-Project" : "New Project");
  };

  if (!isVisible) return null;

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
            {getModalTitle()}
            <p className="modal-subtitle">{getModalSubtitle()}</p>
          </div>
        </div>
        <div className="modal-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 2) handleSubmit();
              else handleNextStep();
            }}
          >
            {currentStep === 1 ? (
              <TemplateSelection
                projectData={projectData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleNextStep={handleNextStep}
                typeInputRef={typeInputRef}
              />
            ) : (
              <ProjectDetails
                user={user}
                projectData={projectData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit} // Pass handleSubmit
                nameInputRef={nameInputRef}
                name2InputRef={name2InputRef}
              />
            )}
          </form>
        </div>
        <div className="actions">
          {currentStep === 1 && (
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          )}
          {currentStep > 1 && (
            <button type="button" className="button secondary" onClick={handlePreviousStep}>Back</button>
          )}
          {currentStep < 2 ? (
            <button type="button" className="button primary icon icon-right next" onClick={handleNextStep}>Next</button>
          ) : (
            <button type="button" className="button primary icon new" onClick={handleSubmit}>
              {isSubProject ? "Create Sub-Project" : "Create project"}
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddProjectModal;