import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Redux
import { showAlert } from '../../app/slices/alertSlice';
import { addProject, createSubProject } from '../../app/slices/projectsSlice';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { createNotification } from '../../app/slices/notificationSlice';

// Hooks
import { useModalFocus } from '../../hooks/modalInputFocus';

const PROJECT_TYPES = [
  { id: "template-wedding", value: "Wedding", label: "Wedding" },
  { id: "template-baptism", value: "Baptism", label: "Baptism" },
  { id: "template-birthday", value: "Birthday", label: "Birthday" },
  { id: "template-maternity", value: "Maternity", label: "Maternity" },
  { id: "template-newborn", value: "Newborn", label: "Newborn" },
  { id: "template-anniversary", value: "Anniversary", label: "Anniversary" },
  { id: "template-family", value: "Family", label: "Family" },
  { id: "template-group", value: "Group", label: "Group" },
  { id: "template-travel", value: "Travel", label: "Travel" },
  { id: "template-event", value: "Event", label: "Event" },
  { id: "template-other", value: "Other", label: "Other" },
];

const VALIDITY_OPTIONS = [
  { id: "validity-3", value: "3", label: "3 Months" },
  { id: "validity-6", value: "6", label: "6 Months", className: "free-validity" },
  { id: "validity-12", value: "12", label: "1 Year", disabled: true, className: "upgrade-needed" },
];

const initialProjectData = {
  name: "",
  type: "Wedding",
  email: "",
  phone: "",
  collections: [],
  events: [],
  payments: [],
  expenses: [],
  projectCover: "",
  selectedFilesCount: 0,
  uploadedFilesCount: 0,
  totalFileSize: 0,
  status: "draft",
  projectValidityMonths: '6',
  createdAt: new Date().getTime(),
  lastOpened: new Date().getTime(),
};

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
  const typeInputRef = useRef(null);
  const modalRef = useModalFocus(visible.createProject);

  const onClose = () => dispatch(closeModalWithAnimation("createProject"));

  const validateForm = () => {
    const newErrors = {};
    if (!projectData.name.trim()) newErrors.name = "Project name is required";
    if (!projectData.type.trim()) newErrors.type = "Project type is required";
    setErrors(newErrors);

    if (newErrors.name && nameInputRef.current) nameInputRef.current.focus();
    else if (newErrors.type && typeInputRef.current) typeInputRef.current.focus();

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProjectData((prevData) => ({ ...prevData, [name]: value }));
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

  const handleSubmit = () => {
    if (!validateForm()) return;

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

  const handleNextStep = () => {
    if (currentStep === 1 && !projectData.type.trim()) {
      setErrors({ type: "Project type is required" });
      return;
    }
    setCurrentStep(currentStep + 1);
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
            {currentStep === 1 ? "Choose Template" : currentStep === 2 ? "Project Details" : isSubProject ? "New Sub-Project" : "New Project"}
          </div>
        </div>
        <div className="modal-body">
          {currentStep === 1 && (
            <TemplateSelection
              projectData={projectData}
              errors={errors}
              handleInputChange={handleInputChange}
            />
          )}
          {currentStep === 2 && (
            <ProjectDetails
              projectData={projectData}
              errors={errors}
              handleInputChange={handleInputChange}
              nameInputRef={nameInputRef}
            />
          )}
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

const TemplateSelection = ({ projectData, errors, handleInputChange }) => (
  <div className="form-section">
    <div className="project-validity-options template-options">
      {PROJECT_TYPES.map(({ id, value, label }) => (
        <div className="radio-button-group" key={id}>
          <input
            type="radio"
            id={id}
            name="type"
            value={value}
            checked={projectData.type === value}
            onChange={handleInputChange}
          />
          <label htmlFor={id}>{label}</label>
        </div>
      ))}
    </div>
    {errors.type && <div className="error">{errors.type}</div>}
  </div>
);

const ProjectDetails = ({ projectData, errors, handleInputChange, nameInputRef }) => (
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
          />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>
        <div className="field">
          <label>Bride</label>
          <input
            name="name"
            ref={nameInputRef}
            value={projectData.name}
            placeholder="Matan"
            type="text"
            onChange={handleInputChange}
          />
          {errors.name && <div className="error">{errors.name}</div>}
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
    </div>
  </div>
);

export default AddProjectModal;