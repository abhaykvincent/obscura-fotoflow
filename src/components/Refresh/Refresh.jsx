import React from 'react'

function Refresh({loadProjects}) {
  return (
	<div className="refresh">
        <p>
            Refresh your projects to see the latest updates
        </p>
        <div className="button secondary"

        onClick={loadProjects}
        >Refresh</div>
    </div>
  )
}

export default Refresh