import React from 'react';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch } from 'react-redux';

const EventEditor = ({ events, onChange }) => {
  const dispatch = useDispatch();
  // Handles changes to individual event fields
  const handleEventChange = (index, updatedEvent) => {
    const updatedEvents = [...events];
    updatedEvents[index] = updatedEvent;
    onChange(updatedEvents);
  };

  // Adds a new empty event to the events list
  const handleAddEvent = () => {
    if (events.length < 4) {
      const newEvent = { name: '', date: '', time: '', location: '' };
      onChange([...events, newEvent]);
    }
    else{
      dispatch(showAlert({type:'error',message:'You can add only 4 events'}))
    }
  };
  

  // Removes an event at the specified index
  const handleRemoveEvent = (index) => {
    if (events.length > 1) {
      const updatedEvents = events.filter((_, i) => i !== index);
      onChange(updatedEvents);
    }
  };

  return (
    <div className="event-editor">
      <div className="label-row">
        <label htmlFor="">Events</label>
        <label htmlFor="">Date</label>
        <label htmlFor="">Time</label>
        <label htmlFor="">Location</label>
      </div>

      {events.map((event, index) => (
        <div key={index} className="form-section">
          <div className="field event-row four">
            <input
              type="text"
              placeholder="Event Name"
              className={`${event?.name?.length === 0 ? 'focus' : ''}`}
              value={event?.name}
              onChange={(e) =>
                handleEventChange(index, { ...event, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Select Date"
              className={`${!event.date ? 'focus' : ''}`}
              value={event.date}
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => (e.target.type = 'text')}
              onChange={(e) =>
                handleEventChange(index, { ...event, date: e.target.value })
              }
            />


            <input
              type="text"
              placeholder="Select Time"
              className={`${!event.time ? 'focus' : ''}`}
              value={event.time}
              onFocus={(e) => (e.target.type = 'time')}
              onBlur={(e) => (e.target.type = 'text')}
              onChange={(e) =>
                handleEventChange(index, { ...event, time: e.target.value })
              }
            />

            <input
              type="text"
              className={`${!event.location ? 'focus' : ''}`}
              placeholder="Location"
              value={event.location}
              onChange={(e) =>
                handleEventChange(index, { ...event, location: e.target.value })
              }
            />
            <button className="button secondary outline warnning icon delete" onClick={() => handleRemoveEvent(index)}>
              
            </button>
          </div>
        </div>
      ))}

      <div className="add-event">
        <button className="button primary outline" onClick={handleAddEvent}>Add Event</button>
      </div>
    </div>
  );
};

export default EventEditor;
