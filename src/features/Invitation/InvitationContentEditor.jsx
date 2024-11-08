import React from 'react';
import NameEditor from './NameEditor';
import EventEditor from './EventEditor';



const InvitationContentEditor = ({ data, onChange }) => {
  return (
    <div className="content-editor">
      <NameEditor
        groomName={data.groomName}
        brideName={data.brideName}
        title={data.title}
        message={data.message}
        events={data.events}
        onChange={onChange}
      />
      {/* <TitleEditor title={data.title} onChange={(title) => onChange({ title })} /> */}
      <EventEditor events={data.events} onChange={(events) => onChange({ events })} />
    </div>
  );
};

export default InvitationContentEditor;
