import React from 'react'

function Loading() {
  return (
    <div className="loader-wrap initial">
        <div className="loader"></div>
        <p className='loading-message'>Loading App</p>
    </div>
  )
}

export default Loading
export function LoadingLight() {
  return (
    <div className="loader-wrap lightMode">
        <div className="loader"></div>
        <p className='loading-message'>Loading Project</p>
    </div>
  )
}

// Line Complexity  0.1 ->
// Line Complexity  0.1 ->