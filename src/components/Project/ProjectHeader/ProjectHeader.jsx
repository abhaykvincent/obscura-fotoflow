import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

import { ProjectPageCoverImages } from '../../ProjectPageCover/ProjectPageCoverImages';
import { openModal, closeModalWithAnimation } from '../../../app/slices/modalSlice';
import { deleteProject, updateProjectName } from '../../../app/slices/projectsSlice';
import { selectDomain } from '../../../app/slices/authSlice';

import './ProjectHeader.scss';

export default function ProjectHeader({ project }) {
  const dispatch = useDispatch();
  const domain = useSelector(selectDomain);
  const { id } = useParams();

  const [pinText, setPinText] = useState('');
  const [pinIconClass, setPinIconClass] = useState('hide');
  const [projectName, setProjectName] = useState(project.name);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (project) {
      setPinText(project.pin);
      setProjectName(project.name);
    }
  }, [project]);

  const handlePinCopy = () => {
    navigator.clipboard.writeText(project?.pin).then(() => {
      setPinIconClass('copying');
      setPinText('Copied');

      setTimeout(() => {
        setPinIconClass('');
        setPinText(project.pin);
      }, 2000);
    });
  };

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleProjectNameBlur = () => {
    if (projectName !== project.name) {
      dispatch(updateProjectName({ domain, projectId: project.id, newName: projectName }));
    }
    setIsEditingName(false);
  };

  const handleDeleteProject = () => {
    dispatch(deleteProject({ domain, projectId: id }));
  };

  if (!project) return null;

  return (
    <div className="project-header">
      <div className="project-cover-section">
        <ProjectPageCoverImages project={project} />
        <button className="change-cover-button">Change Cover</button>
      </div>

      <div className="project-details-section">
        <div className="project-name-row">
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={handleProjectNameChange}
              onBlur={handleProjectNameBlur}
              autoFocus
              className="project-name-input"
            />
          ) : (
            <h1 className="project-name" onClick={() => setIsEditingName(true)}>
              {project.name} <span className="icon-edit"></span>
            </h1>
          )}
        </div>

        <div className="project-id-pin-row">
          <span className="project-id">{project.id} <span className="icon-copy"></span></span>
          <div className={`button tertiary icon pin ${pinIconClass}`} onClick={handlePinCopy}>
            {pinText}
          </div>
        </div>

        <div className="project-tags">
          <span className="tag">{project.type}</span>
        </div>

        <div className="project-status-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="status-dropdown-trigger">
                <span className="status-indicator draft"></span> Draft <span className="icon-arrow-down"></span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Draft</DropdownMenuItem>
              <DropdownMenuItem>Published</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="archive-button">Archive</button>
          <span className="archive-info">Archives in 90 Days</span>
        </div>

        <div className="project-expiration-row">
          <span className="expiration-info">Expires in 360 Days</span>
        </div>

        <div className="project-stats-row">
          <span className="stat">2 MB</span>
          <span className="stat">3 Photos</span>
          <span className="stat">1 Galleries</span>
        </div>

        <div className="project-creation-date">
          Project created on {new Date(project.createdAt).toLocaleDateString()}
        </div>

        <div className="project-actions">
          <button
            className={`button primary share icon ${project.uploadedFilesCount > 0 ? '' : 'disabled'}`}
            onClick={() => project.uploadedFilesCount > 0 && dispatch(openModal('shareGallery'))}
          >
            Share
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="icon options"></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <div className="icon-show add" /> New Gallery
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => dispatch(openModal('confirmDeleteproject'))}>
                <div className="icon-show delete" /> Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
