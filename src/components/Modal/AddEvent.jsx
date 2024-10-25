import React, { useEffect, useState } from 'react';
import { addEvent } from '../../app/slices/projectsSlice';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';
import './AddEvent.scss'
import { selectDomain } from '../../app/slices/authSlice';
import { trackEvent } from '../../analytics/utils';
import { useModalFocus } from '../../hooks/modalInputFocus';

function AddEventModal({ project, visible, onClose}) {
  const dispatch = useDispatch();
  const [EventData, setEventData] = useState({
    type: process.env.NODE_ENV === 'development'?'Wedding day':'',
    date: new Date().toISOString().split('T')[0],
    // default time morining "8:00 AM" exactily an convert to a date time format
    time: '09:00',
    location: process.env.NODE_ENV === 'development'?'Kochi, India':'',

    crews: []
  });
  const domain = useSelector(selectDomain)

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEventData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
  };
  const handleSubmit = () => {
    dispatch(addEvent({domain,projectId:project.id,newEvent:EventData}))
    .then((data)=>{
      trackEvent('event_added')
      dispatch(showAlert({type:'success', message:`Event <b>${data.payload.newEvent.type}</b> added successfully!`}));
    })
    onClose('createEvent');
  };

  const modalRef = useModalFocus(visible);
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container" ref={modalRef} >
      <div className="modal create-event">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>onClose('createEvent')}></div>
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
              <input type="date" className="" name="date" value={EventData.date} onChange={handleInputChange}/>
            </div>
            <div className="field">
              <label className="" htmlFor="">Time</label>
              <input type="time" className="" name="date" value={EventData.time} onChange={handleInputChange}/>
            </div>
            <div className="field">
              <label className="" htmlFor="">Location</label>
              <input type="text" className="" name="location" value={EventData.location} onChange={handleInputChange}/>

            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={()=>{onClose('createEvent')}}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddEventModal

  // Line Complexity  0.8 -> 