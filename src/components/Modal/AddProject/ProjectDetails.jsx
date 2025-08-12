import React, { useEffect, useState } from 'react';
import './ProjectDetails.scss';
import { VALIDITY_OPTIONS,ARCHIVE_OPTIONS } from './constants';
import { selectUserStudio } from "../../../app/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
const ProjectDetails = ({ user, projectData, errors, handleInputChange, nameInputRef, name2InputRef }) => {
  const [animateValidity, setAnimateValidity] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
    const currentStudio = useSelector(selectUserStudio);
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
              placeholder="Avani"
              type="text"
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && projectData.name.trim()) {
                  e.preventDefault();
                  name2InputRef.current?.focus();
                }
              }}
            />
            <span></span>
            {errors.name && <div className="error">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Groom</label>
            <input
              name="name2"
              ref={name2InputRef}
              value={projectData.name2}
              placeholder="Adi"
              type="text"
              onChange={handleInputChange}

              // 
            />
            <span></span>
            {errors.name2 && <div className="error">{errors.name2}</div>}
          </div>
        </>
      );
    }
    return (
      <div className="field">
        <label>Name</label>
        <input
          name="name"
          ref={nameInputRef}
          value={projectData.name}
          placeholder={projectData.type === 'Wedding' ? 'Saanvi' : 'Neel Alex'}
          type="text"
          onChange={handleInputChange}
        />
            <span></span>
        {errors.name && <div className="error">{errors.name}</div>}
      </div>
    );
  };

  return (
    <div className="form-section project-details">
      {renderNameFields()}
      <div className="field team-field">
        <label>Team</label>
        <div className="team-members">
          <div className="team-member">
            <div
              className="profile-image"
              style={{ backgroundImage: `url(${user?.photoURL})` }}
            />
            <span className="team-member-name">{user?.displayName}
              
            </span>
          </div>
        </div>
      </div>
      <div className="field live-field">
        <label></label>
        <div
          className={`advanced-toggle ${showAdvanced ? 'down' : 'up'}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>{showAdvanced ? 'Hide Options' : 'Advanced'}</span>
          <span className={`arrow`}></span>
        </div>
      </div>
      <div className={`advanced-options ${showAdvanced ? 'show' : ''}`}>
        <div className="advanced-options-inner">
          <div className="field live-field">
            <label>Live</label>
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
            </div>
          </div>
          <div className="field validity-field">
            <label>Validity</label>
            <div className="project-validity-wrap">
              <div className="project-validity-options">
                {ARCHIVE_OPTIONS.map(({ id, value, label, disabled, className }) => (
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
                Files will be deleted after <span> <b className={animateValidity ? 'validity-change-animation' : ''}>{projectData.projectValidityMonths} years</b>.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;