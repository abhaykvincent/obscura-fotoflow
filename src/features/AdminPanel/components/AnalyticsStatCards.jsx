import React from 'react';

export const AnalyticsStatCards = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="cards">
            <div className="group">
                <div className="card">
                    <h1 className='count'>{summary.avgProjectsPerStudio.toFixed(1)}</h1>
                    <p>Avg Projects</p>
                    <h4 className='cyan'>Per Studio</h4>
                </div>
                <div className="card">
                    <h1 className='count'>{summary.avgPhotosPerProject.toFixed(0)}</h1>
                    <p>Avg Photos</p>
                    <h4 className='purple'>Per Project</h4>
                </div>
            </div>

            <div className="group">
                <div className="card">
                    <h1 className='count'>{summary.avgCollectionsPerProject.toFixed(1)}</h1>
                    <p>Avg Collections</p>
                    <h4 className='orange'>Per Project</h4>
                </div>
                <div className="card">
                    <h1 className='count'>{summary.storageEfficiency.toFixed(2)} MB</h1>
                    <p>Avg File Size</p>
                    <h4 className='green'>Per Photo</h4>
                </div>
            </div>

            <div className="group">
                <div className="card">
                    <h1 className='count'>${summary.estimatedMonthlyBurn.toFixed(2)}</h1>
                    <p>Monthly</p>
                    <h4 className='blue'>Burn Estimate</h4>
                </div>
                <div className="card">
                    <h1 className='count'>{((summary.activeStudios / summary.totalStudios) * 100).toFixed(1)}%</h1>
                    <p>Studio</p>
                    <h4 className='green'>Active Ratio</h4>
                </div>
            </div>
        </div>
    );
};
