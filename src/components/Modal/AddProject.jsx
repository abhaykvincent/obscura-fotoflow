import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../app/slices/alertSlice";
import { addProject, createSubProject } from "../../app/slices/projectsSlice";
import { useNavigate } from "react-router";
import { closeModalWithAnimation, selectModal } from "../../app/slices/modalSlice";
import { selectUser, selectUserStudio } from "../../app/slices/authSlice";
import { useModalFocus } from "../../hooks/modalInputFocus";
import { createNotification } from "../../app/slices/notificationSlice";

function AddProjectModal({ isSubProject = false, parentProjectId = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);
  const user = useSelector(selectUser);

  const onClose = () => dispatch(closeModalWithAnimation("createProject"));

  const [projectData, setProjectData] = useState({
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
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // Track current step

  // Refs for input fields
  const nameInputRef = useRef(null);
  const typeInputRef = useRef(null);

  const validateForm = () => {
    let newErrors = {};
    if (!projectData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!projectData.type.trim()) {
      newErrors.type = "Project type is required";
    }
    setErrors(newErrors);

    // Focus on the first input with an error
    if (newErrors.name && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (newErrors.type && typeInputRef.current) {
      typeInputRef.current.focus();
    }

    return Object.keys(newErrors).length === 0;
  };
  useEffect(() => {
    if (currentStep === 1 ) {
    } else if (currentStep === 2 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentStep]);
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProjectData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const dispatchNotification = (response, user) => {
    console.log(response);
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
    if (!validateForm()) {
      return;
    }
    const domain = currentStudio.domain;
    onClose();
    setTimeout(() => {
      if (isSubProject && parentProjectId) {
        // Create Sub-Project
        dispatch(createSubProject({ domain, parentProjectId, subProjectData: projectData }))
          .then((response) => {
            const { subProjectId } = response.payload;
            dispatch(showAlert({ type: "success", message: "Sub-Project created successfully!" }));
            navigate(`/${domain}/project/${parentProjectId}/sub-project/${subProjectId}`);
          })
          .catch((error) => {
            console.error("Error creating sub-project:", error);
            dispatch(showAlert({ type: "error", message: "Failed to create sub-project." }));
          });
      } else {
        // Create Normal Project
        dispatch(addProject({ domain, projectData }))
          .then((response) => {
            const { id } = response.payload;
            dispatch(showAlert({ type: "success", message: "Project created successfully!" }));
            dispatchNotification(response, user);
            navigate(`/${domain}/project/${id}`);
          })
          .catch((error) => {
            console.error("Error creating project:", error);
            dispatch(showAlert({ type: "error", message: "Failed to create project." }));
          });
      }
    }, 500);
  };

  const modalRef = useModalFocus(visible.createProject);

  if (!visible.createProject) {
    return null;
  }

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
          {currentStep === 1
            ? "Choose Template"
            : currentStep === 2
            ? "Project Details"
            : isSubProject
            ? "New Sub-Project"
            : "New Project"}
        </div>
        </div>
        <div className="modal-body">
        {currentStep === 1 && (
          <div className="form-section">
            <div className="">
              <div className="project-validity-options template-options">
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-wedding"
                    name="type"
                    value="Wedding"
                    checked={projectData.type === "Wedding"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-wedding">Wedding</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-baptism"
                    name="type"
                    value="Baptism"
                    checked={projectData.type === "Baptism"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-baptism">Baptism</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Birthday</label>
                </div>

                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Maternity</label>
                </div>
                
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Newborn</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Anniversary</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Family</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Group</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Travel</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Event</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="template-birthday"
                    name="type"
                    value="Birthday"
                    checked={projectData.type === "Birthday"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="template-birthday">Other</label>
                </div>

              </div>
              {errors.type && <div className="error">{errors.type}</div>}
            </div>
          </div>
        )}

          {currentStep === 2 && (
            <div className="form-section">
               {projectData.type === 'Wedding' ? 
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
              :
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
               }

              <div className="field">
                <label>Validity</label>
                <div className="project-validity-options">
                  <div className="radio-button-group">
                    <input
                      type="radio"
                      id="validity-3"
                      name="projectValidityMonths"
                      value="3"
                      checked={projectData.projectValidityMonths === '3'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="validity-3">3 Months</label>
                  </div>
                  <div className="radio-button-group">
                    <input
                      type="radio"
                      id="validity-6"
                      name="projectValidityMonths"
                      value="6"
                      checked={projectData.projectValidityMonths === '6'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="validity-6" className="free-validity">6 Months</label>
                  </div>
                  <div className="radio-button-group upgrade-needed">
                    <input
                      type="radio"
                      id="validity-12"
                      name="projectValidityMonths"
                      value="12"
                      checked={projectData.projectValidityMonths === '12'}
                      onChange={handleInputChange}
                      disabled
                    />
                    <label htmlFor="validity-12">1 Year</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="actions">
          {currentStep === 1 && (
            <div className="button secondary" onClick={onClose}>
              Cancel
            </div>
          )}
          {currentStep > 1 && (
            <div className="button secondary" onClick={handlePreviousStep}>
              Back
            </div>
          )}
          {currentStep < 2 ? (
            <div className="button primary" onClick={handleNextStep}>
              Next
            </div>
          ) : (
            <div className="button primary" onClick={handleSubmit}>
              {isSubProject ? "Create Sub-Project" : "Create Project"}
            </div>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddProjectModal;