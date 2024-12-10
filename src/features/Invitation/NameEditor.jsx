import React from 'react';

const NameEditor = ({ groomName, brideName, font, size, title, message,onChange }) => {
  console.log(groomName)
  return (
    <div className="form-section name-editor ">
      <div className="row four">

        <div className='field'>
            <label>Groom</label>
            <input
            type="text"
            value={groomName}
            onChange={(e) => onChange({ groomName: e.target.value })}
            />
        </div>
        <div className='field'>
            <label>Bride</label>
            <input
            type="text"
            value={brideName}
            onChange={(e) => onChange({ brideName: e.target.value })}
            />
        </div>

        {/* <div className='field font-select'>
            <label>Font</label>
            <select className='secondery'
            value={font}
            onChange={(e) => onChange({ font: e.target.value })}
            >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            </select>
        </div>
        <div className='field'>
            <label>Size</label>
            <input className='secondery'
            type="number"
            value={size}
            onChange={(e) => onChange({ size: e.target.value })}
            min="10"
            max="100"
            />
        </div> */}
      </div>
      <div className="row two">
        <div className='field'>
            <label>Context</label>
            <input
            type="text"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
        <div className='field'>
            <label>Message</label>
            <input
            type="text"
            value={message}
            onChange={(e) => onChange({ message: e.target.value })}
            />
          </div>
      </div>
    </div>
  );
};

export default NameEditor;
