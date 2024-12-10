import React from 'react';
import NameEditor from './NameEditor';
import EventEditor from './EventEditor';



const InvitationContentEditor = ({ data, onChange }) => {
  console.log(data)
  return (
    <div className="content-editor">
      <div className="editor-row">

        <NameEditor
          groomName={data.groomName}
          brideName={data.brideName}
          title={data.title}
          message={data.message}
          events={data.events}
          onChange={onChange}
        />
      </div>
      {/* <TitleEditor title={data.title} onChange={(title) => onChange({ title })} /> */}
      
      <div className="editor-row">
      <EventEditor events={data.events} onChange={(events) => onChange({ events })} />
      </div>
    </div>
  );
};

export default InvitationContentEditor;
