import React from 'react';

const templates = ['Wedding', 'Birthday', 'Baptism', 'Corporate', 'Other'];

function TemplateSelection({ packageData, setPackageData, errors }) {
  const handleTemplateSelection = (template) => {
    setPackageData({ ...packageData, template });
  };

  return (
    <div className="template-selection">
      <h2>Select a Template</h2>
      <div className="templates-grid">
        {templates.map((template) => (
          <div
            key={template}
            className={`template-card ${packageData.template === template ? 'selected' : ''}`}
            onClick={() => handleTemplateSelection(template)}
          >
            {template}
          </div>
        ))}
      </div>
      {errors.template && <p className="error-message">{errors.template}</p>}
    </div>
  );
}

export default TemplateSelection;
