import React from 'react';

export const AnalyticsTab = ({ type, analytics, loading, lastUpdated, onRefresh }) => {
    
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

    const renderContent = () => {
        switch (type) {
            case 'analytics-growth':
                return (
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
                        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                             <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                💡 <strong>Growth Insight:</strong> Active studios represent photographers who have engaged with the platform in the last 14 days. A high Adoption Rate indicates strong product-market fit.
                             </p>
                        </div>
                    </div>
                );

            case 'analytics-costs':
                return (
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Infrastructure & Cost Control</h4>
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
                        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                             <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                💡 <strong>Cost Insight:</strong> The monthly burn is an estimate based on Firebase Storage costs ($0.026/GB). Monitoring the Efficiency Ratio helps identify if photographers are uploading unnecessarily large files.
                             </p>
                        </div>
                    </div>
                );

            case 'analytics-retention':
                return (
                    <div style={{ marginTop: '30px' }}>
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
                        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                             <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                💡 <strong>Retention Insight:</strong> Completion Rate tracks how many projects reach the 'client delivery' phase. A high stickiness score (Avg Projects/User) indicates users are making FotoFlow their primary workflow tool.
                             </p>
                        </div>
                    </div>
                );

            case 'analytics-leaderboard':
                return (
                    <div style={{ marginTop: '0px' }}>
                        {/* Benchmark Cards for Leaderboard */}
                        <div style={{ marginTop: '30px' }}>
                            <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Global Benchmarks</h4>
                            <div className="admin-dashboard">
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
                                </div>
                            </div>
                        </div>
                        <h4 style={{ color: '#555', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>Heavy User Leaderboard (Top 10 Storage)</h4>
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    {/* Identity */}
                                    <th style={{ width: '200px' }}>Studio</th>
                                    <th>Status</th>
                                    
                                    {/* Volume Metrics */}
                                    <th style={{ borderLeft: '1px solid #333', paddingLeft: '15px' }}>Projects</th>
                                    <th>Photos</th>
                                    <th>Storage</th>

                                    {/* Efficiency Ratios */}
                                    <th style={{ borderLeft: '1px solid #333', paddingLeft: '15px' }} title="Average Photos per Project">Ph/Proj</th>
                                    <th title="Average Photos per Collection">Ph/Coll</th>
                                    <th title="Average Storage per Project">MB/Proj</th>
                                    <th title="Average Size per Photo">MB/Photo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((studio, index) => (
                                    <tr key={studio.id}>
                                        {/* Identity */}
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{index + 1}. {studio.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>/{studio.domain}</div>
                                        </td>
                                        <td>
                                            <span className={`paid-status ${studio.isActive ? 'paid' : 'idle'}`}>
                                                {studio.isActive ? 'Active' : 'Dormant'}
                                            </span>
                                        </td>

                                        {/* Volume Metrics */}
                                        <td style={{ borderLeft: '1px solid #333', paddingLeft: '15px' }}>{studio.projectsCount}</td>
                                        <td>{studio.photosCount.toLocaleString()}</td>
                                        <td style={{ color: studio.storageUsed > 5000 ? '#ff6b6b' : '#fff' }}>
                                            {(studio.storageUsed / 1024).toFixed(2)} GB
                                        </td>

                                        {/* Efficiency Ratios */}
                                        <td style={{ borderLeft: '1px solid #333', paddingLeft: '15px' }}>{studio.avgPhotosPerProject.toFixed(0)}</td>
                                        <td>{studio.avgPhotosPerCollection.toFixed(0)}</td>
                                        <td>{studio.avgStoragePerProject.toFixed(1)}</td>
                                        <td>{studio.avgSizePerPhoto.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="invoice-history">
            <section className="analytics-overview">
                {/* Header (Always Visible) */}
                <div className="actions" style={{ alignItems: 'flex-start' }}>
                    <div className="left-actions">
                        <h3>{type.split('-')[1].charAt(0).toUpperCase() + type.split('-')[1].slice(1)} Analytics</h3>
                        <p style={{ color: '#888', fontSize: '0.9em', marginTop: '5px' }}>
                            Platform-wide intelligence • Last calculated: <span style={{ color: '#aaa' }}>{formatLastUpdated(lastUpdated)}</span>
                        </p>
                    </div>
                    <div className="right-actions">
                        <button 
                            className={`button secondary outline icon refresh ${loading ? 'loading' : ''}`} 
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh All Metrics'}
                        </button>
                    </div>
                </div>

                {/* Tabbed Content */}
                {renderContent()}

            </section>
        </div>
    );
};