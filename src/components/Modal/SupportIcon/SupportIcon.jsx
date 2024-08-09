import React, { useState } from 'react'
import './SupportIcon.scss'

function SupportIcon() {
    //active state
    const [isExpanded,isExpandedSet] = useState(false)

  return (
    <div className={`customer-support ${isExpanded? 'expanded':''}`}>
        <div className="support-actions">
          <div className="action orange"><div className="icon bug"></div>Report Bug</div>
          <div className="action blue"><div className="icon pricing"></div>Pricing</div>
          <div className="action green"><div className="icon support"></div>Customer Support</div>
        </div>
        <div className="support-icon"
            onClick={()=>isExpandedSet(!isExpanded)}
        ></div>
      </div>
  )
}

export default SupportIcon