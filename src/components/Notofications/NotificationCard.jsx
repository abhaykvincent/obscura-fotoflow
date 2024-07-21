import React from 'react'

function NotificationCard({title, context, i, recent}) {
  return (
	<div className="notification">
		<div className="left"><div className="image"></div></div>
		<div className="center">
			<h4 className="title">{title} <span>{i*2+1}m</span></h4>
			<p className="context">{context}</p>
		</div>
		<div className="right">
			{recent&&<div className="new"></div>}
		</div>
	</div>
  )
}

export default NotificationCard