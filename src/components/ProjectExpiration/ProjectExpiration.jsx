import React, { useEffect, useState } from 'react';

export default function ProjectExpiration({ createdAt, projectValidityMonths = 12 }) {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      // Use projectValidityMonths to calculate expiration
      const expirationDate = new Date(createdAt);
      expirationDate.setMonth(expirationDate.getMonth() + projectValidityMonths);
      
      const currentDate = Date.now();

      // Calculate the difference in days
      const remainingTime = expirationDate.getTime() - currentDate;
      const daysLeft = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
      
      // Update state
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
      {daysRemaining > 0 
        ? `Project archives in ${daysRemaining} days` 
        : 'Project is archived'}
    </div>
  );
}
