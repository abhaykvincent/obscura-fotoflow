import React from 'react'
import { fetchProjects } from '../../app/slices/projectsSlice'
import { useDispatch, useSelector } from 'react-redux'
import { selectUserStudio } from '../../app/slices/authSlice'

function Refresh() {

  const dispatch = useDispatch()
  const defaultStudio = useSelector(selectUserStudio)
  let currentDomain = defaultStudio.domain
  return (
	<div className="refresh">
        <p>Refresh to get the latest updates</p>
        <div className="button secondary"onClick={()=>{dispatch(fetchProjects({currentDomain}))}}>Refresh</div>
    </div>
  )
}

export default Refresh