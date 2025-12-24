import React from 'react';

export const AnalyticsTab = ({ analytics, loading, lastUpdated, onRefresh }) => {
    
    const formatLastUpdated = (timestamp) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (loading) {
        return (
            <div className="invoice-history">
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    <div className="loading-spinner" style={{ marginBottom: '20px' }}>
                        {/* You can use a CSS spinner here */}
                        <span style={{ fontSize: '1.2em' }}>Aggregating Platform Data...</span>
                    </div>
                    <p>This might take a moment as we calculate metrics across all studios and projects.</p>
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
                        Generate Analytics Report
                    </button>
                </div>
            </div>
        );
    }

    const { summary } = analytics;

    return (
        <div className="invoice-history">
            <section className="analytics-overview">
                <div className="actions" style={{ alignItems: 'flex-start' }}>
                    <div className="left-actions">
                        <h3>Platform Analytics</h3>
                        <p style={{ color: '#888', fontSize: '0.9em', marginTop: '5px' }}>
                            Last updated: <span style={{ color: '#aaa' }}>{formatLastUpdated(lastUpdated)}</span>
                        </p>
                    </div>
                    <div className="right-actions">
                        <button 
                            className={`button secondary outline icon refresh ${loading ? 'loading' : ''}`} 
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>

                <div className="admin-dashboard" style={{ marginTop: '20px' }}>
                    <div className="cards">
                        <div className="group">
                            <div className="card">
                                <h1 className='count'>{summary.avgProjectsPerStudio.toFixed(1)}</h1>
                                <p>Average</p>
                                <h4 className='cyan'>Projects / Studio</h4>
                            </div>
                            <div className="card">
                                <h1 className='count'>{summary.avgCollectionsPerProject.toFixed(1)}</h1>
                                <p>Average</p>
                                <h4 className='purple'>Collections / Project</h4>
                            </div>
                        </div>

                        <div className="group">
                            <div className="card">
                                <h1 className='count'>{summary.avgPhotosPerProject.toFixed(0)}</h1>
                                <p>Average</p>
                                <h4 className='orange'>Photos / Project</h4>
                            </div>
                            <div className="card">
                                <h1 className='count '>{summary.avgPhotosPerCollection.toFixed(0)}</h1>
                                <p>Average</p>
                                <h4 className='blue'>Photos / Collection</h4>
                            </div>
                        </div>

                        <div className="group">
                            <div className="card">
                                <h1 className='count'>{summary.avgFileSize.toFixed(2)} MB</h1>
                                <p>Average</p>
                                <h4 className='green'>File Size</h4>
                            </div>
                            <div className="card">
                                <h1 className='count'>{(summary.totalFileSize / 1024).toFixed(2)} GB</h1>
                                <p>Total</p>
                                <h4 className='yellow'>Storage Used</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Global Totals</h3>
                    <div className="admin-dashboard">
                        <div className="cards">
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{summary.totalStudios}</h1>
                                    <p>Total</p>
                                    <h4 className='cyan'>Studios</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.totalProjects}</h1>
                                    <p>Total</p>
                                    <h4 className='purple'>Projects</h4>
                                </div>
                            </div>
                            <div className="group">
                                <div className="card">
                                    <h1 className='count'>{summary.totalCollections}</h1>
                                    <p>Total</p>
                                    <h4 className='orange'>Collections</h4>
                                </div>
                                <div className="card">
                                    <h1 className='count'>{summary.totalPhotos}</h1>
                                    <p>Total</p>
                                    <h4 className='green'>Photos</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};