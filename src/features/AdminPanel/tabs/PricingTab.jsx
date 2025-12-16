import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { 
    selectPricingGroups, 
    deletePricingGroup, 
    setEditingPricingGroup, 
    updatePricingGroup 
} from '../../../app/slices/adminSettingsSlice';

export const PricingTab = () => {
    const dispatch = useDispatch();
    
    // -- State --
    const pricingGroups = useSelector(selectPricingGroups);
    const [selectedGroupId, setSelectedGroupId] = useState(null); // If null, viewing list of groups
    
    // Editing States (Plan editing remains local/inline for now)
    const [editingPlan, setEditingPlan] = useState(null);   

    // -- Derived State --
    const selectedGroup = useMemo(() => 
        pricingGroups.find(g => g.id === selectedGroupId), 
    [pricingGroups, selectedGroupId]);

    // -- Group Handlers --
    const handleCreateGroup = () => {
        dispatch(setEditingPricingGroup(null));
        dispatch(openModal('managePricingGroup'));
    };

    const handleEditGroup = (group) => {
        dispatch(setEditingPricingGroup(group));
        dispatch(openModal('managePricingGroup'));
    };

    const handleDeleteGroup = (groupId) => {
        if (window.confirm('Are you sure you want to delete this pricing group?')) {
            dispatch(deletePricingGroup(groupId));
        }
    };

    // -- Plan Handlers --
    const handleCreatePlan = () => {
        setEditingPlan({
            id: null,
            name: '',
            price: 0,
            features: [],
            active: true
        });
    };

    const handleEditPlan = (plan) => {
        setEditingPlan({ ...plan });
    };

    const handleDeletePlan = (planId) => {
         if (window.confirm('Are you sure you want to delete this plan?')) {
             if (selectedGroup) {
                 const updatedPlans = selectedGroup.plans.filter(p => p.id !== planId);
                 dispatch(updatePricingGroup({ id: selectedGroupId, plans: updatedPlans }));
             }
        }
    };

    const handleSavePlan = () => {
        if (!editingPlan.name || !selectedGroup) return;

        let updatedPlans;
        if (editingPlan.id) {
            // Update existing plan
            updatedPlans = selectedGroup.plans.map(p => p.id === editingPlan.id ? editingPlan : p);
        } else {
            // Create new plan
            const newPlan = { ...editingPlan, id: `plan_${Date.now()}` };
            updatedPlans = [...selectedGroup.plans, newPlan];
        }
        
        dispatch(updatePricingGroup({ id: selectedGroupId, plans: updatedPlans }));
        setEditingPlan(null);
    };

    // -- Render Views --

    // 1. Group List View
    if (!selectedGroupId) {
        return (
            <div className="invoice-history">
                <section className="pricing-list">
                    <div className="actions">
                        <div className="left-actions">
                            <h3>Custom Pricings</h3>
                            <p style={{ color: '#888', fontSize: '0.9em', marginTop: '5px' }}>
                                Manage different pricing tiers and packages.
                            </p>
                        </div>
                        <div className="right-actions">
                            <div className="button primary" onClick={handleCreateGroup}>Create Custom Pricing</div>
                        </div>
                    </div>

                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Pricing Name</th>
                                <th>Description</th>
                                <th>Plans Count</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pricingGroups.map(group => (
                                <tr key={group.id} className="clickable-row">
                                    <td onClick={() => setSelectedGroupId(group.id)} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#fff' }}>
                                        {group.name}
                                    </td>
                                    <td onClick={() => setSelectedGroupId(group.id)} style={{ cursor: 'pointer' }}>
                                        {group.description}
                                    </td>
                                    <td onClick={() => setSelectedGroupId(group.id)} style={{ cursor: 'pointer' }}>
                                        {group.plans.length} Plans
                                    </td>
                                    <td className="actions">
                                        <button className="button secondary outline small" onClick={() => setSelectedGroupId(group.id)}>Manage Plans</button>
                                        <button className="button secondary outline small" style={{ marginLeft: '10px' }} onClick={() => handleEditGroup(group)}>Edit</button>
                                        <button className="button secondary outline small" style={{ marginLeft: '10px', color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => handleDeleteGroup(group.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        );
    }

    // 2. Plans Detail View (inside a group)
    return (
        <div className="invoice-history">
            <section className="pricing-list">
                {/* Navigation Header */}
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#888' }}>
                    <span 
                        onClick={() => { setSelectedGroupId(null); setEditingPlan(null); }} 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        className="hover-text-white"
                    >
                        &larr; Back to Custom Pricings
                    </span>
                    <span>/</span>
                    <span style={{ color: '#fff' }}>{selectedGroup?.name}</span>
                </div>

                <div className="actions">
                    <div className="left-actions">
                        <h3>{selectedGroup?.name} <span style={{ fontWeight: 'normal', fontSize: '0.8em', color: '#666' }}>- Plans & Pricing</span></h3>
                    </div>
                    <div className="right-actions">
                        <div className="button primary" onClick={handleCreatePlan}>New Plan</div>
                    </div>
                </div>
                
                {/* Plan Editor Form */}
                {editingPlan ? (
                    <div className="edit-plan-form" style={{ padding: '20px', background: '#2a2a2a', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444' }}>
                        <h4 style={{ marginBottom: '15px' }}>{editingPlan.id ? `Edit ${editingPlan.name}` : 'New Plan'}</h4>
                        <div style={{ display: 'grid', gap: '15px', maxWidth: '400px' }}>
                            <label>
                                Plan Name
                                <input 
                                    type="text" 
                                    value={editingPlan.name} 
                                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                    className="search-input"
                                    placeholder="e.g. Freelancer"
                                    style={{ width: '100%', marginTop: '5px' }}
                                />
                            </label>
                            <label>
                                Price ($ Monthly)
                                <input 
                                    type="number" 
                                    value={editingPlan.price} 
                                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                                    className="search-input"
                                    style={{ width: '100%', marginTop: '5px' }}
                                />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={editingPlan.active} 
                                    onChange={(e) => setEditingPlan({...editingPlan, active: e.target.checked})}
                                />
                                Active Status
                            </label>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="button primary" onClick={handleSavePlan}>Save Plan</button>
                                <button className="button secondary outline" onClick={() => setEditingPlan(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>Plan Name</th>
                            <th>Price (Monthly)</th>
                            <th>Features</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedGroup?.plans.map(plan => (
                            <tr key={plan.id} className="clickable-row">
                                <td><strong>{plan.name}</strong></td>
                                <td>${plan.price}</td>
                                <td>
                                    <span style={{ fontSize: '0.85em', color: '#ccc' }}>
                                        {plan.features.slice(0, 2).join(', ')}
                                        {plan.features.length > 2 && ` +${plan.features.length - 2} more`}
                                    </span>
                                </td>
                                <td>
                                    <span className={`paid-status ${plan.active ? 'paid' : 'trial'}`}>
                                        {plan.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button className="button secondary outline small" onClick={() => handleEditPlan(plan)}>Edit</button>
                                    <button className="button secondary outline small" style={{ marginLeft: '10px', color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => handleDeletePlan(plan.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};


