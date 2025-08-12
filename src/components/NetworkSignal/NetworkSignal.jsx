import React, { useState, useEffect } from 'react';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import './NetworkSignal.scss';

const NetworkSignal = () => {
  const isOnline = useNetworkStatus();
  const [statusChanged, setStatusChanged] = useState(false);

  useEffect(() => {
    setStatusChanged(true);
    const timer = setTimeout(() => setStatusChanged(false), 1000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  return (
    <div className="network-signal">
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'} ${statusChanged ? 'status-change' : ''}`}></div>
    </div>
  );
};

export default NetworkSignal;