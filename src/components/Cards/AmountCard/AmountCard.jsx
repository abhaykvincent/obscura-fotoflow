import React from 'react'

function AmountCard({amount,direction,percentage,status,project}) {
	let formattedPercentage=''
	// if(percentage is string)
	if(typeof percentage ==='string'){
		formattedPercentage = percentage;

	if(percentage=='Balance'){
		formattedPercentage = 'Balance';
	}	}
	else{
		//calculate percentage
		percentage = percentage? (percentage*10000).toFixed(0):0;
		formattedPercentage = percentage && parseFloat(percentage).toFixed(0)+'%';
	}
  return (
	
	<div className="box amount-card">
		<div className="amount">
			<span className="direction">{direction}</span> 
			{amount}
		</div>
		<div className="percentage">{formattedPercentage}</div>
		<div className={`status ${status}`}>
			<div className="signal"></div>
		</div>
		
	</div>
  )
}

export default AmountCard