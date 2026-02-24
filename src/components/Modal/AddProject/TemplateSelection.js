import React from 'react';
import { PROJECT_TYPES } from './constants';

const TemplateSelection = ({ projectData, errors, handleInputChange, handleNextStep, typeInputRef }) => {
  const standardTypes = PROJECT_TYPES.filter(t => t.value !== 'Other').map(t => t.value);
  const isCustomType = !standardTypes.includes(projectData.type);

  const handleRadioClick = (value) => {
    if (value !== 'Other') {
      handleNextStep(value);
    }
  };

  const handleOtherSelect = () => {
    handleInputChange({ target: { name: 'type', value: '' } });
  };

  return (
    <>
      <div className="form-section stared-templates">
        <p className="stared-templates-label">Choose a template</p>
        <div className="project-validity-options template-options">
          {PROJECT_TYPES.map(({ id, stared, value, label }) => (
            stared && <div className="radio-button-group" key={id}>
              <input
                type="radio"
                id={id}
                onClick={() => handleRadioClick(value)}
                name="type"
                value={value}
                checked={projectData.type === value}
                onChange={handleInputChange}
              />
              <label className={id} htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>
        {errors.type && <div className="error">{errors.type}</div>}
      </div>
      <div className="form-section other-templates">
        <div className="project-validity-options template-options">
          {PROJECT_TYPES.map(({ id, stared, value, label }) => (
            !stared && <div className="radio-button-group" key={id}>
              <input
                type="radio"
                id={id}
                onClick={() => handleRadioClick(value)}
                name="type"
                value={value}
                checked={value === 'Other' ? isCustomType : projectData.type === value}
                onChange={value === 'Other' ? handleOtherSelect : handleInputChange}
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>
        {errors.type && <div className="error">{errors.type}</div>}
      </div>

      {isCustomType && (
        <div className="form-section custom-project-type">
          <label>Project Type</label>
          <input
            ref={typeInputRef}
            type="text"
            name="type"
            value={projectData.type}
            onChange={handleInputChange}
            placeholder="Enter project type"
            className="custom-type-input"
            autoFocus
          />
        </div>
      )}
    </>
  );
};

export default TemplateSelection;