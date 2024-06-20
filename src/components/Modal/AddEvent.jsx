import React, { useEffect, useState } from 'react';

function AddEventModal({ project, visible, onClose, onSubmit }) {
  const [EventData, setEventData] = useState({
    type: 'Wedding day',
    date: '10-20-2025',
    location:'Kochi, India'
  });
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEventData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
  };
  const handleSubmit = () => {
    console.log(project.id,EventData);
    onSubmit(project.id,EventData);
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="modal create-project">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize disabled"></div>
            <div className="control maximize disabled"></div>
          </div>
          <div className="modal-title">Create Event</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            <div className="field">
              <label className="" htmlFor="">Event</label>
              <select className="" name="type" value={EventData.type} onChange={handleInputChange}>
                <option value="Engagement">Engagement</option>
                <option value="Wedding Eve">Wedding Eve</option>
                <option value="Wedding day">Wedding day</option>
                {/* Add more options as needed */}
              </select>
            </div>
            <div className="field">
              <label className="" htmlFor="">Date</label>

              <input type="text" className="" name="date" value={EventData.date} onChange={handleInputChange}/>
            </div>
            <div className="field">
              <label className="" htmlFor="">Location</label>
              <input type="text" className="" name="location" value={EventData.location} onChange={handleInputChange}/>

            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddEventModal


function convertToSlug(inputString) {
  // Replace spaces with hyphens and convert to lowercase
  return inputString.replace(/\s+/g, '-').toLowerCase();
}