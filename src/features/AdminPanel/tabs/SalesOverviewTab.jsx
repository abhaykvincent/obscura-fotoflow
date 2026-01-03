import React from 'react';

export const SalesOverviewTab = () => {
    return (
        <div className="invoice-history">
            <div className="support-list" style={{ padding: '20px', color: '#fff' }}>
                <h3>Sales Overview Dashboard</h3>
                <p>Charts and detailed metrics coming soon...</p>
                {/* Placeholders for charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div style={{ height: '200px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Revenue Trend Chart
                    </div>
                    <div style={{ height: '200px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Subscription Growth Chart
                    </div>
                </div>
            </div>
        </div>
    );
};
