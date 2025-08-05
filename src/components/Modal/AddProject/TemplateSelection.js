import React from 'react';
import { PROJECT_TYPES } from './constants';

const TemplateSelection = ({ projectData, errors, handleInputChange,handleNextStep }) => (
  <>
    <div className="form-section stared-templates">
      <div className="project-validity-options template-options">
        {PROJECT_TYPES.map(({ id, stared, value, label }) => (
          stared && <div className="radio-button-group" key={id}>
            <input
              type="radio"
              id={id}
              onClick={() => handleNextStep()}
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
    <div className="form-section other-templates">
      <div className="project-validity-options template-options">
        {PROJECT_TYPES.map(({ id,stared, value, label }) => (
          !stared && <div className="radio-button-group" key={id}>
            <input
              type="radio"
              id={id}
            onClick={() => handleNextStep()}
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
  </>
);

export default TemplateSelection;