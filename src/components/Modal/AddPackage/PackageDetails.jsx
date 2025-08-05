import React from 'react';

const suggestedDescriptions = {
  Wedding: 'A comprehensive package for your special day, capturing every moment from the ceremony to the reception.',
  Birthday: 'Celebrate another year with a fun-filled photoshoot. Perfect for all ages!',
  Baptism: 'Capture the sacred moments of your child’s baptism with beautiful, timeless photographs.',
  Corporate: 'Professional headshots and event coverage for your business needs.',
  Other: 'A flexible package for any occasion. Tell us what you need, and we’ll make it happen.',
};

function PackageDetails({ packageData, setPackageData, handleInputChange, errors }) {
  const handleTierChange = (index, event) => {
    const { name, value } = event.target;
    const tiers = [...packageData.tiers];
    tiers[index][name] = value;
    setPackageData({ ...packageData, tiers });
  };

  const handleServiceChange = (tierIndex, serviceIndex, event) => {
    const { value } = event.target;
    const tiers = [...packageData.tiers];
    tiers[tierIndex].services[serviceIndex] = value;
    setPackageData({ ...packageData, tiers });
  };

  const addService = (tierIndex) => {
    const tiers = [...packageData.tiers];
    tiers[tierIndex].services.push('');
    setPackageData({ ...packageData, tiers });
  };

  const removeService = (tierIndex, serviceIndex) => {
    const tiers = [...packageData.tiers];
    tiers[tierIndex].services.splice(serviceIndex, 1);
    setPackageData({ ...packageData, tiers });
  };

  const addTier = () => {
    if (packageData.tiers.length < 3) {
      const tiers = [...packageData.tiers, { name: '', price: '', services: [''] }];
      setPackageData({ ...packageData, tiers });
    }
  };

  const removeTier = (index) => {
    const tiers = [...packageData.tiers];
    tiers.splice(index, 1);
    setPackageData({ ...packageData, tiers });
  };

  return (
    <div className="package-details form-section">
      <div className="form-group field">
        <label htmlFor="name">Package Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={packageData.name}
          onChange={handleInputChange}
          placeholder="e.g., Christian Wedding Packages"
        />
        {errors.name && <p className="error-message">{errors.name}</p>}
      </div>
      <div className="form-group field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          name="description"
          value={packageData.description}
          onChange={handleInputChange}
          placeholder={suggestedDescriptions[packageData.template]}
        />
        {errors.description && <p className="error-message">{errors.description}</p>}
      </div>
    </div>
  );
}

export default PackageDetails;
