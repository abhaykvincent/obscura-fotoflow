import React, { useEffect, useState } from 'react';

export default function ProjectExpiration({ 
  createdAt, 
  status, 
  archiveThreshold = null, 
  expiryDate = null,
  projectValidityMonths = 6, 
  fileRetentionYears = 1
}) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isArchiving, setIsArchiving] = useState(true);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      let targetDate;
      
      if (status === 'archive') {
        // Stage 2: Countdown to final expiry
        targetDate = expiryDate ? new Date(expiryDate) : null;
        setIsArchiving(false);
      } else {
        // Stage 1: Countdown to archiving
        targetDate = archiveThreshold ? new Date(archiveThreshold) : null;
        setIsArchiving(true);
      }

      if (!targetDate) {
        // Fallback calculation if props are missing
        targetDate = new Date(createdAt);
        if (status === 'archive') {
          targetDate.setMonth(targetDate.getMonth() + (fileRetentionYears * 12));
          targetDate.setDate(targetDate.getDate() + 30);
        } else {
          targetDate.setMonth(targetDate.getMonth() + projectValidityMonths);
        }
      }
      
      const currentDate = Date.now();
      const remainingTime = targetDate.getTime() - currentDate;
      const daysLeft = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
      
      setDaysRemaining(daysLeft);
    };

    calculateDaysRemaining();

    // Optional: Update remaining days every day (if the component is long-lived)
    const intervalId = setInterval(calculateDaysRemaining, 24 * 60 * 60 * 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [createdAt]);

  return (
    <div className='project-expiration'>
      {status === 'expired' ? (
        'Project is expired'
      ) : daysRemaining <= 14 ? (
        daysRemaining > 0 ? (
          `${isArchiving ? 'Archives' : 'Expires'} in ${daysRemaining} days`
        ) : (
          `Project is ${isArchiving ? 'archived' : 'expired'}`
        )
      ) : null}
    </div>
  );
}
