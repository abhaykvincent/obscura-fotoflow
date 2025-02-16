import React, { useEffect, useState } from 'react';

export default function ProjectExpiration({ createdAt }) {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      // 365 days in milliseconds
      const expirationPeriod = 365 * 24 * 60 * 60 * 1000;
      const expirationDate = createdAt + expirationPeriod;
      const currentDate = Date.now();

      // Calculate the difference in days
      const remainingTime = expirationDate - currentDate;
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
    <>
    <div className='project-expiration'>
      {daysRemaining > 0 
        ? `Project expires in ${daysRemaining} days` 
        : 'Project has expired'}
    </div>
    <div className='project-expiration'>
      {daysRemaining > 0 
        ? `Project Archives in ${daysRemaining} days` 
        : 'Project has expired'}
    </div>
    </>
  );
}
