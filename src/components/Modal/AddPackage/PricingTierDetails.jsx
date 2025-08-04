import React from 'react';

function PricingTierDetails({ packageData, setPackageData }) {
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
    <div className="pricing-tier-details">
      <h3>Pricing Tiers</h3>
      {packageData.tiers.map((tier, tierIndex) => (
        <div key={tierIndex} className="tier">
          <div className="tier-header">
            <h4>Tier {tierIndex + 1}</h4>
            <button type="button" className="button danger" onClick={() => removeTier(tierIndex)}>Remove</button>
          </div>
          <div className="form-group">
            <label htmlFor={`tier-name-${tierIndex}`}>Tier Name</label>
            <input
              type="text"
              id={`tier-name-${tierIndex}`}
              name="name"
              value={tier.name}
              onChange={(e) => handleTierChange(tierIndex, e)}
              placeholder="e.g., Standard, Premium"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`tier-price-${tierIndex}`}>Price</label>
            <input
              type="text"
              id={`tier-price-${tierIndex}`}
              name="price"
              value={tier.price}
              onChange={(e) => handleTierChange(tierIndex, e)}
              placeholder="e.g., $500"
            />
          </div>
          <div className="form-group">
            <label>Services</label>
            {tier.services.map((service, serviceIndex) => (
              <div key={serviceIndex} className="service-input">
                <input
                  type="text"
                  value={service}
                  onChange={(e) => handleServiceChange(tierIndex, serviceIndex, e)}
                  placeholder="e.g., 4 hours of coverage"
                />
                <button type="button" className="button danger" onClick={() => removeService(tierIndex, serviceIndex)}>Remove</button>
              </div>
            ))}
            <button type="button" className="button secondary" onClick={() => addService(tierIndex)}>Add Service</button>
          </div>
        </div>
      ))}
      {packageData.tiers.length < 3 && (
        <button type="button" className="button primary" onClick={addTier}>Add Tier</button>
      )}
    </div>
  );
}

export default PricingTierDetails;
