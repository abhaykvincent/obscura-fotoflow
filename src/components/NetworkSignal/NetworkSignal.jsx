import React, { useState, useEffect } from 'react';
import './NetworkSignal.scss';

const NetworkSignal = () => {
  const [speed, setSpeed] = useState(0);
  const [signalStrength, setSignalStrength] = useState(0);

  useEffect(() => {
    const measureSpeed = () => {
      const imageAddr = "https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg";
      const downloadSize = 4995374; //bytes
      let startTime, endTime;
      const download = new Image();
      download.onload = () => {
        endTime = (new Date()).getTime();
        const duration = (endTime - startTime) / 1000;
        const bitsLoaded = downloadSize * 8;
        const speedBps = (bitsLoaded / duration).toFixed(2);
        const speedKbps = (speedBps / 1024).toFixed(2);
        const speedMbps = (speedKbps / 1024).toFixed(2);
        setSpeed(speedMbps);
          console.log('High speed detected:', speedMbps, 'Mbps');
        if (speedMbps > 20) {
          setSignalStrength(3);
        } else if (speedMbps > 10) {
          setSignalStrength(2);
        } else {
          setSignalStrength(1);
        }
      }
      startTime = (new Date()).getTime();
      download.src = imageAddr + "?n=" + Math.random();
    };

    measureSpeed();
    const interval = setInterval(measureSpeed, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="network-signal">
      <div className="signals">
        <div className={`signal ${signalStrength >= 3 ? 'active' : ''}`}></div>
        <div className={`signal ${signalStrength >= 2 ? 'active' : ''}`}></div>
        <div className={`signal ${signalStrength >= 1 ? 'active' : ''}`}></div>
      </div>
    </div>
  );
};

export default NetworkSignal;
