import React from 'react';

export const AnalyticsTab = ({ analytics, loading, lastUpdated, onRefresh }) => {
    
    const formatLastUpdated = (timestamp) => {
        if (!timestamp) return 'Never';
        const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + " years ago";
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + " months ago";
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + " days ago";
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + " hours ago";
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + " minutes ago";
        if (seconds < 10) return "just now";
        return Math.floor(seconds) + " seconds ago";
    };

    if (loading) {
        return (
            <div className="invoice-history">
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    <div className="loading-spinner" style={{ marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.2em' }}>Aggregating SaaS Metrics...</span>
                    </div>
                    <p>Scanning all studios, projects, and collections to generate your growth report.</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="invoice-history">
                <div style={{ 
                    padding: '60px 20px', 
                    textAlign: 'center', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '12px',
                    border: '1px dashed #444',
                    margin: '20px'
                }}>
                    <h3 style={{ color: '#fff', marginBottom: '10px' }}>No Analytics Data Generated</h3>
                    <p style={{ color: '#888', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px' }}>
                        Platform-wide analytics require a manual trigger as they involve deep scanning of all studio collections.
                    </p>
                    <button className="button primary" onClick={onRefresh}>
                        Generate SaaS Metrics Report
                    </button>
                </div>
            </div>
        );
    }

    const { summary, leaderboard } = analytics;

    return (
        <div className="invoice-history">
            <section className="analytics-overview">
                {/* Header */}
                <div className="actions" style={{ alignItems: 'flex-start' }}>
                    <div className="left-actions">
                        <h3>Platform Intelligence</h3>
                        <p style={{ color: '#888', fontSize: '0.9em', marginTop: '5px' }}>
                            Last calculated: <span style={{ color: '#aaa' }}>{formatLastUpdated(lastUpdated)}</span>
                        </p>
                    </div>
                    <div className="right-actions">
                        <button 
                            className={`button secondary outline icon refresh ${loading ? 'loading' : ''}`} 
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh Metrics'}
                        </button>
                    </div>
                </div>

                {/* 1. Growth & Adoption */}
                <div style={{ marginTop: '30px' }}>
                    <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Growth & Adoption</h4>
                    <div className="admin-dashboard">
                        <div className="cards">
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{summary.avgTTFU.toFixed(1)}h</h1>
                                    <p>Avg Time to First Upload</p>
                                    <h4 className='cyan'>Onboarding TTFU</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.activeStudios}</h1>
                                    <p>Active (last 14 days)</p>
                                    <h4 className='green'>Active Studios</h4>
                                </div>
                            </div>
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{((summary.activeStudios / summary.totalStudios) * 100).toFixed(1)}%</h1>
                                    <p>Active vs Total</p>
                                    <h4 className='purple'>Adoption Rate</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.dormantStudios}</h1>
                                    <p>Inactive {'>'} 14 days</p>
                                    <h4 className='orange'>Dormant Studios</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Infrastructure & Cost Control */}
                <div style={{ marginTop: '40px' }}>
                    <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Infrastructure & Cost</h4>
                    <div className="admin-dashboard">
                        <div className="cards">
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>${summary.estimatedMonthlyBurn.toFixed(2)}</h1>
                                    <p>Storage Ops Estimate</p>
                                    <h4 className='orange'>Monthly Burn</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.storageEfficiency.toFixed(2)} MB</h1>
                                    <p>Avg File Size</p>
                                    <h4 className='blue'>Efficiency Ratio</h4>
                                </div>
                            </div>
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{(summary.totalFileSize / 1024).toFixed(2)} GB</h1>
                                    <p>Platform Storage</p>
                                    <h4 className='yellow'>Total Footprint</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{(summary.totalFileSize / summary.totalPhotos || 0).toFixed(2)}</h1>
                                    <p>MB / Photo Avg</p>
                                    <h4 className='cyan'>Compression Ratio</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Engagement & Retention */}
                <div style={{ marginTop: '40px' }}>
                    <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Engagement & Retention</h4>
                    <div className="admin-dashboard">
                        <div className="cards">
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{summary.projectCompletionRate.toFixed(1)}%</h1>
                                    <p>Selected / Completed</p>
                                    <h4 className='green'>Completion Rate</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.avgProjectsPerStudio.toFixed(1)}</h1>
                                    <p>Avg Projects / User</p>
                                    <h4 className='purple'>Stickiness</h4>
                                </div>
                            </div>
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{summary.totalPhotos.toLocaleString()}</h1>
                                    <p>Total Deliverables</p>
                                    <h4 className='blue'>Assets Managed</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.totalProjects}</h1>
                                    <p>Total Success Events</p>
                                    <h4 className='cyan'>Pipeline Volume</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Heavy User Leaderboard */}
                <div style={{ marginTop: '40px' }}>
                    <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Heavy User Leaderboard (Top 10 Storage)</h4>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Studio Name</th>
                                <th>Domain</th>
                                <th>Projects</th>
                                <th>Photos</th>
                                <th>Storage Used</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((studio, index) => (
                                <tr key={studio.id}>
                                    <td><strong>{index + 1}. {studio.name}</strong></td>
                                    <td>/{studio.domain}</td>
                                    <td>{studio.projectsCount}</td>
                                    <td>{studio.photosCount}</td>
                                    <td style={{ color: studio.storageUsed > 5000 ? '#ff6b6b' : '#fff' }}>
                                        {(studio.storageUsed / 1024).toFixed(2)} GB
                                    </td>
                                    <td>
                                        <span className={`paid-status ${studio.isActive ? 'paid' : 'idle'}`}>
                                            {studio.isActive ? 'Active' : 'Dormant'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
