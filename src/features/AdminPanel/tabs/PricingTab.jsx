import React, { useState } from 'react';

const MOCK_PLANS = [
    { id: 'core', name: 'Core', price: 0, features: ['20GB Storage', 'Basic Support'], active: true },
    { id: 'pro', name: 'Pro', price: 29, features: ['1TB Storage', 'Priority Support', 'Custom Branding'], active: true },
    { id: 'studio', name: 'Studio', price: 99, features: ['Unlimited Storage', '24/7 Support', 'API Access', 'White Label'], active: true }
];

export const PricingTab = () => {
    const [plans, setPlans] = useState(MOCK_PLANS);
    const [editingPlan, setEditingPlan] = useState(null);

    const handleEdit = (plan) => {
        setEditingPlan({ ...plan });
    };

    const handleSave = () => {
        setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
        setEditingPlan(null);
    };

    const handleCancel = () => {
        setEditingPlan(null);
    };

    return (
        <div className="invoice-history">
            <section className="pricing-list">
                <div className="actions">
                    <div className="left-actions">
                        <h3>Manage Pricing Plans</h3>
                    </div>
                    <div className="right-actions">
                        <div className="button primary" onClick={() => console.log('Create Plan')}>New Plan</div>
                    </div>
                </div>
                
                {editingPlan ? (
                    <div className="edit-plan-form" style={{ padding: '20px', background: '#2a2a2a', borderRadius: '8px', marginBottom: '20px' }}>
                        <h4>Edit {editingPlan.name}</h4>
                        <div style={{ display: 'grid', gap: '10px', maxWidth: '400px' }}>
                            <label>
                                Price ($):
                                <input 
                                    type="number" 
                                    value={editingPlan.price} 
                                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                                    className="search-input"
                                    style={{ width: '100%', marginTop: '5px' }}
                                />
                            </label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="button primary" onClick={handleSave}>Save</button>
                                <button className="button secondary outline" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>Plan Name</th>
                            <th>Price (Monthly)</th>
                            <th>Features Count</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(plan => (
                            <tr key={plan.id} className="clickable-row">
                                <td>{plan.name}</td>
                                <td>${plan.price}</td>
                                <td>{plan.features.length}</td>
                                <td>
                                    <span className={`paid-status ${plan.active ? 'paid' : 'trial'}`}>
                                        {plan.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button className="button secondary outline small" onClick={() => handleEdit(plan)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};
