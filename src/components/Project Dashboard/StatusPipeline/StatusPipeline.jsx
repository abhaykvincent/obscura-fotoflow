import React from 'react';
import './StatusPipeline.scss';

const STAGES = ['Booking', 'Crew', 'Shoot', 'Upload', 'Selection', 'Design', 'Delivery'];

const StatusPipeline = ({ currentTab, ledState }) => {
  const renderTab = (stage) => {
    const isActive = currentTab?.toLowerCase() === stage.toLowerCase();
    return (
      <div key={stage} className={`pipeline-tab ${isActive ? 'active' : ''} ${stage==='Payment' ? 'active' : ''}`}>
        <div className={`led-indicator ${ledState?.color || 'green'} ${ledState?.style === 'blinking' ? 'led-blink' : ''} ${!isActive ? 'dimmed' : ''}`} />
        <span className="tab-name">{stage}</span>
      </div>
    );
  };

  return (
    <div className="status-pipeline-wrapper" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div className="status-pipeline">
        {STAGES.map(renderTab)}
      </div>
      {renderTab('Payment')}
    </div>
  );
};

export default StatusPipeline;
