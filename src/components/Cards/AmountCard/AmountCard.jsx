import React from 'react'

function AmountCard({amount,direction,percentage,status}) {
  return (
	
	<div className="box amount-card">
		<div className="amount">
			<span className="direction">{direction}</span> 
			{amount}
		</div>
		<div className="percentage">{percentage}</div>
		<div className={`status ${status}`}>
                <div className="signal"></div>
              </div>
		
	</div>
  )
}

export default AmountCard