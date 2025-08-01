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
    onClose();

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for animation

    const projectType = isSubProject ? "Sub-Project" : "Project";
    const action = isSubProject && parentProjectId
      ? createSubProject({ domain, parentProjectId, subProjectData: projectData })
      : addProject({ domain, projectData });

    try {
      const payload = await dispatch(action).unwrap();
      
      dispatchNotification(payload, user);
      dispatch(showAlert({ type: "success", message: `${projectType} created successfully!` }));

      const { id, subProjectId } = payload;
      const navigateTo = isSubProject ? `${parentProjectId}/sub-project/${subProjectId}` : id;
      navigate(`/${domain}/project/${navigateTo}`);
    } catch (error) {
      console.error(`Error creating ${projectType.toLowerCase()}:`, error);
      dispatch(showAlert({ type: "error", message: `Failed to create ${projectType.toLowerCase()}.` }));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getModalTitle = () => {
    if (currentStep === 1) return "Create project";
    return isSubProject ? "New Sub-Project" : "Project Details";
  };

  const getModalSubtitle = () => {
    if (currentStep === 1) return "Choose Template";
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
            <button type="button" className="button primary" onClick={handleNextStep}>Next</button>
          ) : (
            <button type="button" className="button primary" onClick={handleSubmit}>
              {isSubProject ? "Create Sub-Project" : "Create Project"}
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

const ProjectDetails = ({ user, projectData, errors, handleInputChange, nameInputRef, name2InputRef }) => {
  const [animateValidity, setAnimateValidity] = useState(false);

  useEffect(() => {
    if (projectData.projectValidityMonths) {
      setAnimateValidity(true);
      const timer = setTimeout(() => setAnimateValidity(false), 500);
      return () => clearTimeout(timer);
    }
  }, [projectData.projectValidityMonths]);

  const renderNameFields = () => {
    if (projectData.type === 'Wedding') {
      return (
        <>
          <div className="field">
            <label>Bride</label>
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
            <label>Groom</label>
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
      );
    }
    return (
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
    );
  };

  return (
    <div className="form-section">
      {renderNameFields()}
      <div className="field">
        <label>Team</label>
        <div className="team-members">
          <div className="team-member">
            <div
              className="profile-image"
              style={{ backgroundImage: `url(${user?.photoURL})` }}
            />
            <span className="team-member-name">{user?.displayName}</span>
          </div>
        </div>
      </div>
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
            After <span> <b className={animateValidity ? 'validity-change-animation' : ''}>{projectData.projectValidityMonths} months</b> ,</span> only <span>you & client</span> can access.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;