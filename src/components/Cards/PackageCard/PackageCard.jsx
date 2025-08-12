import React from 'react';
import './PackageCard.scss';

const PackageCard = ({ packageData }) => {
  const { name, createdAt } = packageData;

  return (
    <div className="package-card">
      <div className="package-card-header">
        <h3>{name}</h3>
      </div>
      <div className="package-card-body">
        <p>Created: {new Date(createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default PackageCard;
