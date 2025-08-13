import React from 'react';
import './TextBlock.scss';

const TextBlock = ({ section, onSectionUpdate }) => {
  return (
    <div className="text-block-section">
      <h1 contentEditable>Text Block</h1>
      <div
        contentEditable
        suppressContentEditableWarning={true}
        onBlur={(e) => onSectionUpdate({ ...section, content: e.target.innerHTML })}
      >
        {section.content || 'Click to edit'}
      </div>
    </div>
  );
};

export default TextBlock;
