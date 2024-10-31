import React from 'react';
import CoverPhotoUploader from './CoverPhotoUploader';
import InvitationContentEditor from './InvitationContentEditor';
import ColorPicker from '../../components/ColourPicker/ColourPicker';
import BackgroundPicker from './BackgroundPicker';

const Editor = ({ data, onChange }) => {
  console.log(data)
  return (
    <div className="editor">
      <div className="editor-row two">
        <ColorPicker color={data.backgroundColor} onChange={(color) => onChange({ backgroundColor: color })} />
        <CoverPhotoUploader projectCover={data.coverPhoto} onChange={(photo) => onChange({ coverPhoto: photo })} />
      </div>
      <div className="editor-row">
        <BackgroundPicker background={data.background} onChange={(bg) => onChange({ background: bg })} />
      </div>
      <div className="editor-row">

      <InvitationContentEditor data={data} onChange={onChange} />
      </div>
    </div>
  );
};

export default Editor;
