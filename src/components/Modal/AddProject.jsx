import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../app/slices/alertSlice";
import { addProject, createSubProject } from "../../app/slices/projectsSlice";
import { useNavigate } from "react-router";
import { closeModalWithAnimation, selectModal } from "../../app/slices/modalSlice";
import { selectUserStudio } from "../../app/slices/authSlice";
import { useModalFocus } from "../../hooks/modalInputFocus";

function AddProjectModal({ isSubProject = false, parentProjectId = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);

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
    status: "draft",
    projectCover: "",
    uploadedFilesCount: 0,
    selectedFilesCount: 0,
    totalFileSize: 0,
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
      <div className="modal create-project">
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
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
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
