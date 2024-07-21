import React from 'react'
import { capitalizeFirstLetter } from '../../../utils/stringUtils'

function CrewCard({user,role}) {
  return (
	<div className={` ${role === 'assistant' ? 'assistant-card':'crew-card'} box`}>
		{role === 'assistant' ? '':<div className="status">
			<div className="signal"></div>
		</div>
}
		<div className={`avatar ${user && user.userId}`}></div>
		{role === 'assistant' ? '':<div className="name">
			<p>{user && user.name}</p>
			<p className='role'>{capitalizeFirstLetter(role)}</p>
		</div>}
	</div>
  )
}

export default CrewCard