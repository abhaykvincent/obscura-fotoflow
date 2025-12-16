import React from 'react';

export const SalesStatCards = ({ revenue = 12500, activeSubs = 142, churnRate = "2.4%", newTrials = 24 }) => {
    return (
        <div className="cards">
            <div className="group">
                <div className="card">
                    <h1 className='count'>${revenue}</h1>
                    <p>Monthly</p>
                    <h4 className='green'>MRR</h4>
                </div>
                <div className="card">
                    <h1 className='count'>{activeSubs}</h1>
                    <p>Active</p>
                    <h4 className='cyan'>Subscriptions</h4>
                </div>
            </div>

            <div className="group">
                <div className="card">
                    <h1 className='count'>{churnRate}</h1>
                    <p>Monthly</p>
                    <h4 className='orange'>Churn Rate</h4>
                </div>
                <div className="card">
                    <h1 className='count '>{newTrials}</h1>
                    <p>This Month</p>
                    <h4 className='purple'>New Trials</h4>
                </div>
            </div>

            <div className="group">
                <div className="card">
                    <h1 className='count'>$124</h1>
                    <p>Avg</p>
                    <h4 className='blue'>ARPU</h4>
                </div>
                <div className="card">
                    <h1 className='count'>85%</h1>
                    <p>Trial</p>
                    <h4 className='green'>Conversion</h4>
                </div>
            </div>
        </div>
    );
};
