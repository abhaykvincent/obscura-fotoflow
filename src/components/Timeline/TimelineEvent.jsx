import React from 'react'
import PropTypes from 'prop-types'

function TimelineEvent({event}) {
  return (
    <div className={`timeline-event ${event.status}`}>
            {
                event.date ?
                    <div className="date">
                        <div className="month">JUN</div>
                        <div className="day">10</div>
                        <div className="year">2024</div>
                    </div>
                    :
                    <div className="date">
                    </div>


                
            }
        
        <div className="body">
            <div className="status">
                <div className={`signal draft `}></div>
            </div>
            <div className="card-content">

                <h4 className="title">{event.title?event.title:'None'}</h4>
                <p className="description"> {event.description?event.description:'None'}</p>
            </div>
        </div>
    </div>
  )
}


export default TimelineEvent
