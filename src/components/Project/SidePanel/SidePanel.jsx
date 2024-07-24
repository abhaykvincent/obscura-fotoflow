import React from 'react'
import TimelineEvent from '../../Timeline/TimelineEvent'
import { timelineData } from '../../../data/timeline'

function SidePanel() {
  return (
    <div className="side-panel box">
        <div className="headings">
            
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