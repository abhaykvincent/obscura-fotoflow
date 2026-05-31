import React from 'react';
import { PROJECT_TYPES } from './constants';

const POPULAR_SUGGESTIONS = [
  'Portrait',
  'Fashion',
  'Event',
  'Corporate',
  'Commercial',
  'Fine Art',
  'Landscape'
];

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
    setTimeout(() => {
      typeInputRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && projectData.type.trim()) {
      e.preventDefault();
      handleNextStep(projectData.type);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleInputChange({ target: { name: 'type', value: suggestion } });
    setTimeout(() => {
      typeInputRef.current?.focus();
    }, 50);
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
        <div className="form-section custom-project-type-container animated-fade-in">
          <div className="custom-input-header">
            <label htmlFor="custom-type-input" className="custom-input-label">
              What kind of project are you creating?
            </label>
            <span className="custom-input-subtitle">Type anything or select a popular option below</span>
          </div>

          <div className="custom-input-wrapper">
            <input
              id="custom-type-input"
              ref={typeInputRef}
              type="text"
              name="type"
              value={projectData.type}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Portrait Session, Fashion Shoot..."
              className="custom-type-input"
              autoFocus
            />
            {projectData.type.trim() && (
              <button
                type="button"
                className="custom-type-submit-btn"
                onClick={() => handleNextStep(projectData.type)}
                title="Proceed"
              >
                <span>Proceed</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            )}
          </div>

          <div className="suggestions-container">
            <p className="suggestions-label">Popular choices</p>
            <div className="suggestion-chips">
              {POPULAR_SUGGESTIONS.map((suggestion) => {
                const isSelected = projectData.type.toLowerCase() === suggestion.toLowerCase();
                return (
                  <button
                    key={suggestion}
                    type="button"
                    className={`suggestion-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateSelection;