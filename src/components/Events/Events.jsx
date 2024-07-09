import React, { useState } from 'react'
import AddEventModal from '../Modal/AddEvent'
import AddCrewModal from '../Modal/AddCrew';
import CrewCard from '../Cards/CrewCard/CrewCard';
import { getUserByID, teams } from '../../data/teams';

function DashboardEvents({project})
{
  // Modal
  const [modal, setModal] = useState({createEvent: false,addCrew:false})
  // maKE ONLY modalType TRUE OTHERS false
  const openModal = (modalType) => setModal({...modal, [modalType]: true });
  const closeModal = (modalType) => {
    setModal({...modal, [modalType]: false });}
  
    // Events
    const [selectedEventID, setSelectedEventID] = useState('')

  return (
    <div className="shoots">

      <div className="headings">
        <div className="heading-shoots">
          
          <h3 className='heading '>Shoots</h3>
        <div className="new-shoot button tertiary l2 outline"
        onClick={ ()=>{
            openModal('createEvent')
          }
          }>+ New</div>
        </div>
        {
          project.events && project.events.length >0 &&
            <div className="heading-crew">

              <h3 className='heading '>Crew</h3>
            </div>
        }
      </div>
      
      <div className="shoot-list">
        {/* loop events from project */}
        {
          project.events && 
          project.events.map((event) => (
       
        <div key={event.id} className="event-container">
          <div className="shoot">
            <div className="time">
              <div className="status large">
                <div className="signal"></div>
              </div>
              <div className="date">
                <h1>28</h1>
                <h5>Feb</h5>
              </div>
              <p>{event.type}</p>   
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
            <div className="cta button secondary outline">Reschedule</div>
          </div>
          <div className="crew">
            {
              event.crews&&event.crews.map((crew) => (
                crew.role !== 'assistant' &&
                <CrewCard key={crew.assigne} user={getUserByID(crew.assigne)} role={crew.role}/>
              ))
            }<div className="assistants">
              {
              event.crews&&event.crews.map((crew) => (
                crew.role == 'assistant' &&
                <CrewCard key={crew.assigne} user={getUserByID(crew.assigne)} role={crew.role}/>
              ))
            }
              <div className="assistant-card new-crew box"
              onClick={ ()=>{
                setSelectedEventID(event.id)
                openModal('addCrew')
              }
              }>
                <p>Crew</p>
              </div>
            </div>
          </div>
        </div>))
 }
      </div>
      
      
      <AddEventModal 
        project={project} 
        visible={modal.createEvent} 
        onClose={closeModal} 
      />
      <AddCrewModal
        project={project} 
        eventId={selectedEventID}
        visible={modal.addCrew} 
        onClose={closeModal}  
      />
      
    </div>
  )
}

export default DashboardEvents
// Line Complexity  1.0 -> 