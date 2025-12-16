import React from 'react';

export const StatCards = ({ usersCount, studiosCount, ticketsOpen = 12, ticketsClosed = 12 }) => {
    return (
        <div className="cards">
            <div className="group">
                <div className="card">
                    <h1 className='count'><span className='icon user'></span>{usersCount}</h1>
                    <p>All time</p>
                    <h4 className='cyan'>Total Users</h4>
                </div>
                <div className="card">
                    <h1 className='count'><span className='icon studio'></span>{studiosCount}</h1>
                    <p>All time</p>
                    <h4 className='cyan'>Total Studios</h4>
                </div>
            </div>

            <div className="group">
                <div className="card">
                    <h1 className='count'>64 TB</h1>
                    <p>Firebase</p>
                    <h4 className='purple'>Storage</h4>
                </div>
                <div className="card">
                    <h1 className='count '>2</h1>
                    <p>Referal</p>
                    <h4 className='cyan'>Code</h4>
                </div>
            </div>

            <div className="group">
                <div className="card">
                    <h1 className='count'><span className='icon ticket'></span>{ticketsOpen}</h1>
                    <p>Tickets</p>
                    <h4 className='yellow'>Open</h4>
                </div>
                <div className="card">
                    <h1 className='count'><span className='icon ticket'></span>{ticketsClosed}</h1>
                    <p>Tickets</p>
                    <h4 className='green'>Closed</h4>
                </div>
            </div>
        </div>
    );
};
