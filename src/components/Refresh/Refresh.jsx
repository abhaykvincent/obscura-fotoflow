import React from 'react'
import { fetchProjects } from '../../app/slices/projectsSlice'
import { useDispatch } from 'react-redux'

function Refresh() {
  const dispatch = useDispatch()
  return (
	<div className="refresh">
        <p>
            Refresh your projects to see the latest updates
        </p>
        <div className="button secondary"

        onClick={()=>{dispatch(fetchProjects())}}
        >Refresh</div>
    </div>
  )
}

export default Refresh