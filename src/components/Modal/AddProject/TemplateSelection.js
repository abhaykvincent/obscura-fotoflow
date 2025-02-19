import React from 'react';
import { PROJECT_TYPES } from './constants';

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

export default TemplateSelection;