import React from 'react'
import './CommingSoon.scss'
import { Link } from 'react-router-dom'

function CommingSoon(
	{title}
) {
  return (
	<main className="gallery projects-coming-soon">
		<div className="welcome-section">
			<div className="welcome-content">
				<div className='welcome-message-top user-name'>
					<h1 className='welcome-message'> <span className='iconic-gradient'>{title} </span>Coming Soon</h1>
					
				<h2 className='welcome-message sub'>Stay  for <span className="bold">Updates </span>!</h2>
				<p>Apply for early Access</p>
				<Link to="/subscription" className="button primary">Join</Link>
				</div>
			</div>
		</div>
		<div className="section">
			<div className={`page-illustration ${title.toLowerCase()}-illustration`}>

			</div>
		</div>
	</main>
  )
}

export default CommingSoon