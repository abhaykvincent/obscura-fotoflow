import React from 'react';

const templates = ['Wedding', 'Birthday', 'Baptism', 'Corporate', 'Other'];

function TemplateSelection({ packageData, setPackageData, errors }) {
  const handleTemplateSelection = (template) => {
    setPackageData({ ...packageData, template });
  };

  return (
    <div className="form-section">
      <h2>Select a Template</h2>
      <div className="project-validity-options template-options">
        {templates.map((template) => (
          <div className="radio-button-group" key={template}

        >
          <input
            type="radio"
            id={template}
            onClick={() => handleTemplateSelection(template)}
            name="type"
          />
          <label htmlFor={template}>{template}</label>
        </div>

        ))}
      </div>
      {errors.template && <p className="error-message">{errors.template}</p>}
    </div>
  );
}

export default TemplateSelection;
