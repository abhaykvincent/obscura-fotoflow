import React from 'react';
import './StatusPipeline.scss';

const STAGES = ['Booking', 'Crew', 'Shoot', 'Ingest', 'Proofing', 'Design', 'Delivery'];

const StatusPipeline = ({ currentTab, ledState }) => {
  return (
    <div className="status-pipeline">
      {STAGES.map((stage) => {
        const isActive = currentTab?.toLowerCase() === stage.toLowerCase();
        return (
          <div key={stage} className={`pipeline-tab ${isActive ? 'active' : ''}`}>
            <span className="tab-name">{stage}</span>
            {isActive && ledState && (
              <div className={`led-indicator ${ledState.color} ${ledState.style === 'blinking' ? 'led-blink' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusPipeline;
