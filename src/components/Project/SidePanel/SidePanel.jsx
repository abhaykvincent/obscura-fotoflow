import React from 'react'
import TimelineEvent from '../../Timeline/TimelineEvent'
import { timelineData } from '../../../data/timeline'

function SidePanel() {
  return (
    <div className="side-panel box">
        <div className="headings">
            <div className="heading-shoots heading-section">
                <h3 className='heading '>Client</h3>
            <div className="options">
                <div className="button tertiary l2">Edit</div>
            </div>
            </div>
            
        </div>
        <div className="client">
            <div className="client-image">
                <div className="profile-picture">

                </div>
            </div>
            <div className="client-details">
                <div className="client-field client-name">
                    <div className="icon profile"></div>
                    <p className='name highlight'>Ethan K Ross</p>
                </div>
                <div className="client-field client-email">
                    <div className="icon email"></div>
                    <p className='name'>ethan.ross@gmail.com</p>
                </div>
                <div className="client-field client-phone">
                    <div className="icon phone"></div>
                    <p className='name'>+1 354 123-9998</p>
                </div>
                <div className="client-field client-location">
                    <div className="icon location"></div>
                    <p className='name'>Toronto, ON</p>
                </div>
            </div>
        </div>
        
        <div className="headings">
            <div className="heading-shoots heading-section">
                <h3 className='heading '>Timeline</h3>
                <div className="coming-soon">
                    <div className="coming-soon-tag">SOON</div>
                </div>
            </div>
        </div>
        <div className="timeline">
            <div className="guide-line"></div>
            <div className="events">
                {timelineData.slice().reverse().map((event, index) => (
                    <TimelineEvent
                        key={index}
                        event={{ title: event.title,description: event.description,date: event.date,status: event.status}}
                    />
                ))}
            </div>
        </div>
    </div>
  )
}

export default SidePanel
// Line complexity 4.0 -> 