import React from 'react';

const ColorPicker = ({ color, onChange }) => {
  const colorSuggestions = ['#FF5733', '#78a3c3', '#3357FF', '#FF33A8', '#3fb175']; // Predefined color options

  return (
    <div className="color-picker">
      <label>Choose Colour</label>
      <div className="box-body">
        <input 
        className='colour-picket-input'
            type="color" 
            value={color} 
            onChange={(e) => onChange(e.target.value)} 
        />
        <div className="color-suggestions">
            {colorSuggestions.map((suggestedColor) => (
            <div 
                key={suggestedColor} 
                className="color-option" 
                style={{ backgroundColor: suggestedColor, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', margin: '0 4px' }}
                onClick={() => onChange(suggestedColor)}
            />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
