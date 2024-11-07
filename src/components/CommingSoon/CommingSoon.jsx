import React from 'react'
import './CommingSoon.scss'
import { Link } from 'react-router-dom'

function CommingSoon(
	{title}
) {
  return (
	<main className="projects-coming-soon">
		<div className="welcome-section">
			<div className="welcome-content">
				<div className='welcome-message-top user-name'>
					<h1 className='welcome-message'> <span className='iconic-gradient'>{title} </span>Coming Soon</h1>
					{
						title === 'Store' && <h2 className='welcome-message sub'>Sell <span className="bold">Prints </span> & <span className="bold">Frames </span>!</h2>
					}
					{
						title === 'Financials' && <h2 className='welcome-message sub'>Send <span className="bold">Invoices </span> & Track <span className="bold">Payments </span>!</h2>
					}
					{
						title === 'Calendar' && <h2 className='welcome-message sub'>Sync with <span className="bold">Google Calendar </span>!</h2>
					}
				<p className='apply-label'>Apply for early Access</p>
				<Link  to="/subscription" className="button primary apply-button">Join</Link>
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