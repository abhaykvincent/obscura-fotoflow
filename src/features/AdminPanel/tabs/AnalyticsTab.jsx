import React from 'react';

export const AnalyticsTab = ({ analytics }) => {
    if (!analytics) return <div style={{ color: 'white', padding: '20px' }}>Loading analytics...</div>;

    const { summary } = analytics;

    return (
        <div className="invoice-history">
            <section className="analytics-overview">
                <div className="actions">
                    <div className="left-actions">
                        <h3>Platform Analytics</h3>
                        <p style={{ color: '#888', fontSize: '0.9em', marginTop: '5px' }}>
                            Overview of system-wide performance and usage metrics.
                        </p>
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
