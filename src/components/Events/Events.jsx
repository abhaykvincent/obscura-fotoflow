import React, { useState } from 'react'
import AddEventModal from '../Modal/AddEvent'

function DashboardEvents({project,addEvent})
{
  // Modal
  const [modal, setModal] = useState({createEvent: false})
  const openModal = () => setModal({ createEvent: true });
  const closeModal = () => setModal({ createEvent: false });
  return (
    <div className="shoots">

      <div className="headings">
        <h3 className='heading heading-shoots'>Shoots</h3>
        <h3 className='heading heading-crew'>Crew</h3>
      </div>
      
      <div className="shoot-list">
        <div className="event-container">
          <div className="shoot">
            <div className="time">
              <div className="status large">
                <div className="signal"></div>
              </div>
              <div className="date">
                <h1>14</h1>
                <h5>Feb</h5>
              </div>
              <p>10:00AM</p>
              <p className='location'>Totonto, ON</p>
            </div>
            <div className="details">
              <div className="team-badges">
                <div className="badge"></div>
                <div className="badge second"></div>
                <div className="badge third"></div>
              </div>
            </div>
            <div className="cta button secondary outline">Confirm</div>
          </div>
          <div className="crew">
            <div className="crew-card box">
              <div className="status">
                <div className="signal"></div>
              </div>
              <div className="avatar"></div>
              <div className="name">Abhay Vincent</div>
            </div>
            <div className="crew-card box">
              <div className="status">
                <div className="signal"></div>
              </div>
              <div className="avatar"></div>
              <div className="name">John Doe</div>
            </div>
            <div className="assistants">
              <div className="assistant-card box">
              <div className="status">
                <div className="signal"></div>
              </div><div className="avatar"></div></div>
              <div className="assistant-card box">
              <div className="status">
                <div className="signal"></div>
              </div><div className="avatar"></div></div>
            </div>
          </div>
        </div>

        <div className="event-container">
          <div className="shoot">
            <div className="time">
              <div className="status large">
                <div className="signal"></div>
              </div>
              <div className="date">
                <h1>28</h1>
                <h5>Feb</h5>
              </div>
              <p>8:00AM</p>
              <p className='location'>Wasaga,ON</p>
            </div>
            <div className="details">
              <div className="team-badges">
                <div className="badge"></div>
                <div className="badge second"></div>
                <div className="badge third"></div>
              </div>
            </div>
            <div className="cta button secondary outline">Confirm</div>
          </div>
          <div className="crew">
            <div className="crew-card box">
              <div className="status">
                <div className="signal"></div>
              </div>
              <div className="avatar"></div>
              <div className="name">Abhay Vincent</div>
            </div>
            <div className="crew-card box">
              <div className="status">
                <div className="signal"></div>
              </div>
              <div className="avatar"></div>
              <div className="name">John Doe</div>
            </div>
            <div className="crew-card box">
              <div className="status">
                <div className="signal"></div>
              </div>
              <div className="avatar"></div>
              <div className="name">Jane Doe</div>
            </div>
            <div className="assistants">
              <div className="assistant-card box">
              <div className="status">
                <div className="signal"></div>
              </div><div className="avatar"></div></div>
              <div className="assistant-card box">
              <div className="status">
                <div className="signal"></div>
              </div><div className="avatar"></div></div>
              <div className="assistant-card box">
              <div className="status">
                <div className="signal"></div>
              </div><div className="avatar"></div></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="new-shoot box" 
        onClick={ ()=>{
          openModal()
        }
        }
      >
      </div>
      <AddEventModal 
        project={project} 
        visible={modal.createEvent} 
        onClose={closeModal} 
        onSubmit={addEvent}  
      />
      
    </div>
  )
}

export default DashboardEvents