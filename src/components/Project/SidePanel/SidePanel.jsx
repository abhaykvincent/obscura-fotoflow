import React from 'react'
import TimelineEvent from '../../Timeline/TimelineEvent'
import { timelineData } from '../../../data/timeline'
import ProjectExpiration from '../../ProjectExpiration/ProjectExpiration'

function SidePanel({project}) {
return (
    <div className="side-panel box">
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