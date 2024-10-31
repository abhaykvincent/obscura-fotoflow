import React, { useState, useEffect } from 'react';

const ColorPicker = ({ color, onChange }) => {
  const [activeColor, setActiveColor] = useState(color); // Track the active color

  const colorSuggestions = ['#FF5733', '#78a3c3', '#3357FF', '#FF33A8', '#3fb175']; // Predefined color options

  useEffect(() => {
    setActiveColor(color); // Sync active color with the prop color
  }, [color]);

  const handleColorChange = (newColor) => {
    onChange(newColor); // Call the onChange function passed as a prop
    setActiveColor(newColor); // Update the active color
  };

  const handleRandomColor = () => {
    const randomColorHEX = `#${Math.floor(Math.random()*16777215).toString(16)}`;
    handleColorChange(randomColorHEX); // Set the random color
  };

  return (
    <div className="color-picker">
      <label>Choose Colour</label>
      <div className="box-body">
        <input 
          className='colour-picket-input'
          type="color" 
          value={color} 
          onChange={(e) => handleColorChange(e.target.value)} 
        />
        <div className="color-suggestions">
          {colorSuggestions.map((suggestedColor) => (
            <div 
              key={suggestedColor} 
              className={`color-option ${activeColor === suggestedColor ? 'active' : ''}`} // Add Active class if it's the active color
              style={{ 
                backgroundColor: suggestedColor, 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                margin: '0 4px', 
                
              }}
              onClick={() => handleColorChange(suggestedColor)}
              /* onMouseEnter={() => handleColorChange(suggestedColor)}
              onMouseLeave={() => handleColorChange(color)} */
            />
          ))}
        </div>
        <button 
          className="button tertiary icon icon-only random"
          onClick={handleRandomColor}
        >
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
