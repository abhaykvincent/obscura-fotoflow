import React, { useEffect, useState } from "react";
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
    type: "",
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
    projectValidityMonths: '3',
    createdAt: new Date().getTime(),
    lastOpened: new Date().getTime(),
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProjectData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
const dispatchNotification = (response,user) => {
  console.log(response)
  dispatch(
    createNotification({
      studioId: currentStudio.domain, // Replace with the appropriate project or studio ID
      notificationData: {
        title: response.payload.name, // Updated title
        message: `A new project was successfully created `, // Updated message
        type: 'project', // Changed type to 'project'
        actionLink: '/projects', // Updated action link to navigate to projects
        priority: 'normal',
        isRead: false,
        metadata: {
          createdAt: new Date().toISOString(),
          eventType: 'project_created', // Updated event type
          createdBy: user.email, // Added creator's email
          projectName: 'Project Name', // Add the project name if available
          authMethod: 'google', // Optional: Include if relevant
        },
      },
    })
  );
  };
  const handleSubmit = () => {
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
            dispatchNotification(response,user);
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

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal create-project island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">{isSubProject ? "New Sub-Project" : "New Project"}</div>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <div className="field">
              <label>Project Name</label>
              <input
                name="name"
                value={projectData.name}
                placeholder="Sarah & Matan"
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label>Project Type</label>
              <input
                name="type"
                value={projectData.type}
                type="text"
                placeholder="Wedding, Birthday, ..."
                onChange={handleInputChange}
              />
            </div>
            {/* <div className="field">
              <label>Email</label>
              <input
                name="email"
                value={projectData.email}
                type="text"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                name="phone"
                value={projectData.phone}
                type="text"
                onChange={handleInputChange}
              />
            </div> */}
            <div className="field">
              <label>Validity</label>
              <div className="project-validity-options">
                {/* radio buttons 3,6,12 */}
                <div className="radio-button-group">
                  <input
                  type="radio"
                  id="validity-3" name="projectValidityMonths"
                  value="3"
                  checked={projectData.projectValidityMonths === '3'}
                  onChange={handleInputChange}
                  />
                  <label htmlFor="validity-3">3 Months</label>
                </div>
                <div className="radio-button-group">
                  <input
                  type="radio"
                  id="validity-6" name="projectValidityMonths"
                  value="6"
                  checked={projectData.projectValidityMonths === '6'}
                  onChange={handleInputChange}
                  />
                  <label htmlFor="validity-6" className="free-validity">6 Months</label>
                </div>
                <div className="radio-button-group upgrade-needed">
                  <input
                  type="radio"
                  id="validity-12" name="projectValidityMonths"
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
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>
            Cancel
          </div>
          <div className="button primary" onClick={handleSubmit}>
            {isSubProject ? "Create Sub-Project" : "Create Project"}
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddProjectModal;
