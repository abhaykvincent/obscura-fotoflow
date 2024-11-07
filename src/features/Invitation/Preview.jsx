import React, { useEffect, useState } from 'react';
import backgroundOptionImage1 from '../../assets/img/background-options/background-option-1.png';
import backgroundOptionImage2 from '../../assets/img/background-options/background-option-2.png';
import backgroundOptionImage3 from '../../assets/img/background-options/background-option-3.png';
import backgroundOptionImage4 from '../../assets/img/background-options/background-option-4.png';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { capitalizeFirstLetter, hexToRgb } from '../../utils/stringUtils';
import { useDispatch, useSelector } from 'react-redux';
import { selectDomain } from '../../app/slices/authSlice';
import { useParams } from 'react-router';

const Preview = ({ editor, data,project }) => {
  console.log(editor?'Editor':'Preview')
  console.log(data)
  console.log(editor)
  const dispatch = useDispatch();
  const { studioName } = useParams();
  const [backgroundOptionImage, setBackgroundOptionImage] = useState('');
  const [countdown, setCountdown] = useState('');
  const [selectedColor, setSelectedColor] = useState(data?.backgroundColor || '#ffffff'); // Default to white if no color

  useEffect(() => {

  console.log(data)
    let selectedBackground = '';
    if (!data?.background) return;
    if (data?.background.value === 'background-option-1') {
      selectedBackground = backgroundOptionImage1;
    } else if (data.background.value === 'background-option-2.png') {
      selectedBackground = backgroundOptionImage2;
    } else if (data.background.value === 'background-option-3.png') {
      selectedBackground = backgroundOptionImage3;
    } else if (data.background.value === 'background-option-4.png') {
      selectedBackground = backgroundOptionImage4;
    }
    setBackgroundOptionImage(selectedBackground);
  }, [data]);

  // Calculate countdown to the final event date
useEffect(() => {
  const eventDates = data?.events
    .map((event) => {
      const eventDate = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        eventDate.setHours(hours, minutes);
      }
      return eventDate;
    })
    .filter((date) => !isNaN(date));

  if (eventDates?.length === 0) return;

  // Find the latest (final) event date
  const finalDate = eventDates ? new Date(Math.max(...eventDates)):''

  const updateCountdown = () => {
    const now = new Date();
    const timeDiff = finalDate - now;

    if (timeDiff <= 0) {
      setCountdown("Event ended!");
    } else {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown(
        <>
          <span className="countdown-element">{days}</span>d
          <span className="countdown-element">{hours}</span>h
          <span className="countdown-element">{minutes}</span>m
          <span className="countdown-element">{seconds}</span>s
        </>
      );
    }
  };

  const intervalId = setInterval(updateCountdown, 1000);

  return () => clearInterval(intervalId);
}, [data?.events]);

  // Handle color change
  const handleColorChange = (event) => {
    setSelectedColor(event.target.value);
  };

 const saveDateEvent = () => {
  // Validate and convert event dates to Date objects
  const eventDates = data?.events
    .map((event) => {
      const parsedDate = new Date(event.date);
      return isNaN(parsedDate.getTime()) ? null : parsedDate; // Filter out invalid dates
    })
    .filter((date) => date !== null);

  if (eventDates.length === 0) {
    alert("No valid event dates available!");
    return; // Exit if there are no valid dates
  }

  const finalDate = new Date(Math.max(...eventDates));
  if (isNaN(finalDate.getTime())) {
    alert("Invalid event date!");
    return; // Exit if the final date is invalid
  }

  const cleanString = (str) => str.replace(/[\n\r]+/g, ' ').trim();
  const eventTitle = cleanString(`${data?.groomName} & ${data?.brideName} - ${data?.title}`);
  const eventLocation = cleanString(data?.events.map((event) => event.location).join(', '));
  const eventDescription = cleanString(`Save the date for the wedding of ${data?.groomName} and ${data.brideName}`);

  // Convert finalDate to UTC and format to iCalendar's required format
  const toICALDate = (date) =>
    date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // Formatting to YYYYMMDDTHHMMSSZ

  const startTime = toICALDate(new Date(finalDate.getTime() + 5.5 * 60 * 60 * 1000)); // IST offset
  const endTime = toICALDate(new Date(finalDate.getTime() + (5.5 + 2) * 60 * 60 * 1000)); // 2-hour event duration


  const uid = `${Date.now()}@yourdomain.com`; // Unique identifier

  const calendarEvent = `
      BEGIN:VCALENDAR
      VERSION:2.0
      CALSCALE:GREGORIAN
      METHOD:PUBLISH
      BEGIN:VEVENT
      UID:${uid}
      SUMMARY:${eventTitle}
      LOCATION:${eventLocation}
      DESCRIPTION:${eventDescription}
      DTSTART:${startTime}
      DTEND:${endTime}
      STATUS:CONFIRMED
      SEQUENCE:0
      END:VEVENT
      END:VCALENDAR`.trim();


  const blob = new Blob([calendarEvent], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  a.click();
  window.URL.revokeObjectURL(url);
};

document.title = `${project?.name}'s ${project?.type} Invitation`

  

  return (
    <div className={`preview-window ${editor?'editor-preview':'preview-preview'}`}>
      <div className="screen-wrap">
        <div className="screen" style={{ background: data?.backgroundColor + "05" }}>
          <div className='project-cover' alt="Cover">
            <img src={data?.coverPhoto} alt="" srcset="" />
          </div>
          <div className="container"
            style={{
              backgroundImage: `linear-gradient(rgba(${hexToRgb(data?.backgroundColor || '123123')}, 0.5), rgba(${hexToRgb(data?.backgroundColor|| '123123')}, 0.4)), url(${backgroundOptionImage})`,
              backgroundBlendMode: 'overlay' // Apply the overlay effect
            }}
            
          >
            <p className="invitation-project-title" style={{ color: data?.backgroundColor + "aa" }}>{data?.title}</p>

            <h2 className="invitation-project-name">
              {data?.groomName} {data?.brideName ? <span style={{ color: data?.backgroundColor + "aa" }}> & </span> : ''}{data?.brideName}
            </h2>

            <div className="events">

            {data?.events.map((event, index) => (
                <div key={index} className="event">
                <h3 className={`${event.name ? 'event-type' : 'dummy'}`} style={{ color: data?.backgroundColor + "ba" }}>{event.name}</h3>
                <p dangerouslySetInnerHTML={{ __html: event.date ? formatDate(event.date) : 'Add date' }}></p>
                <p className="event-time">{formatTime(event.time)}</p>
                <p className="event-location">{event.location}</p>
              </div>
              ))}
              <div className="events-cta">
                <p className="countdown"
                  style={{ backgroundColor: data?.backgroundColor + "12" }}
                >In {countdown}</p>
                <div className="button primary"
                  style={{ background: data?.backgroundColor + "77", border: '2px solid ' + data?.backgroundColor + '66' }}
                  onClick={saveDateEvent} // Add onClick handler
                >
                  Save the Date
                </div>
              </div>
              <div className="p host-message">
                <p>{data?.message}</p>
                <p className='hosts-name'>- {data?.groomName} {data?.brideName && '& '+data?.brideName}</p>
              </div>
              <div className="photographer-branding">
                <p>Monemts Capturing by </p>
                <p className='footer-branding-name'>{capitalizeFirstLetter(studioName)}</p>
              </div>

            </div>

          </div>
          <div className="invitation-image-gallery">
            {

            }
          </div>
          <div className="power-button"></div>
          <div className="volume-button"></div>
          <div className="volume-button two"></div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
