import React, { useEffect, useState } from 'react';

export default function ProjectExpiration({ createdAt, projectValidityMonths = 6, fileRetentionYears = 1, expiryDate = null }) {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      let finalExpiryDate;

      if (expiryDate) {
        finalExpiryDate = new Date(expiryDate);
      } else {
        // Fallback: Use fileRetentionYears to calculate expiration (with 30-day grace)
        finalExpiryDate = new Date(createdAt);
        finalExpiryDate.setMonth(finalExpiryDate.getMonth() + (fileRetentionYears * 12));
        finalExpiryDate.setDate(finalExpiryDate.getDate() + 30);
      }
      
      const currentDate = Date.now();

      // Calculate the difference in days
      const remainingTime = finalExpiryDate.getTime() - currentDate;
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
    daysRemaining <= 14 && <div className='project-expiration'>
      {daysRemaining > 0
        ? `Archives in ${daysRemaining} days` 
        : 'Project is archived'}
    </div>
  );
}
