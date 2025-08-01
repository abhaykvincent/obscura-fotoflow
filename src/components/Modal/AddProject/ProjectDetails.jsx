import React, { useEffect, useState } from 'react';
import { VALIDITY_OPTIONS } from './constants';

const ProjectDetails = ({ user, projectData, errors, handleInputChange, handleSubmit, nameInputRef, name2InputRef }) => {
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
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

export default ProjectDetails;