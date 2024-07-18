import React from 'react'

function AmountCard({amount,direction,percentage,status}) {
	const formattedPercentage = percentage && parseFloat(percentage).toFixed(1);
	console.log(formattedPercentage)
  return (
	
	<div className="box amount-card">
		<div className="amount">
			<span className="direction">{direction}</span> 
			{amount}
		</div>
		<div className="percentage">{formattedPercentage}%</div>
		<div className={`status ${status}`}>
                <div className="signal"></div>
              </div>
		
	</div>
  )
}

export default AmountCard