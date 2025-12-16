import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { 
    selectEditingPricingPlan, 
    selectPricingGroups,
    updatePricingGroupAsync 
} from '../../../app/slices/adminSettingsSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import './PricingPlanModal.scss';

const PricingPlanModal = () => {
    const dispatch = useDispatch();
    const { managePricingPlan: isVisible } = useSelector(selectModal);
    const editingPlan = useSelector(selectEditingPricingPlan);
    const pricingGroups = useSelector(selectPricingGroups);
    const modalRef = useModalFocus(isVisible);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        price: 0,
        active: true,
        features: [],
        groupId: null
    });
    
    // Feature input state (comma separated string for editing)
    const [featuresString, setFeaturesString] = useState('');

    useEffect(() => {
        if (isVisible && editingPlan) {
            setFormData(editingPlan);
            setFeaturesString(editingPlan.features ? editingPlan.features.join('\n') : '');
        }
    }, [isVisible, editingPlan]);

    const onClose = () => {
        dispatch(closeModalWithAnimation('managePricingPlan'));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'price' ? Number(value) : value)
        }));
    };
    
    const handleFeaturesChange = (e) => {
        setFeaturesString(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.groupId) return;

        const group = pricingGroups.find(g => g.id === formData.groupId);
        if (!group) return;

        // Parse features
        const features = featuresString.split('\n').map(f => f.trim()).filter(f => f);
        
        const finalPlan = {
            ...formData,
            features
        };
        // Remove internal groupId before saving to plans array (optional, but cleaner)
        const { groupId, ...planData } = finalPlan;

        let updatedPlans;
        if (planData.id) {
            // Update existing plan
            updatedPlans = group.plans.map(p => p.id === planData.id ? planData : p);
        } else {
            // Create new plan
            const newPlan = { ...planData, id: `plan_${Date.now()}` };
            updatedPlans = [...group.plans, newPlan];
        }

        await dispatch(updatePricingGroupAsync({ id: groupId, updates: { plans: updatedPlans } }));
        
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className="modal-container" ref={modalRef}>
            <div className="modal pricing-plan-modal island">
                <div className="modal-header">
                    <div className="modal-controls">
                        <div className="control close" onClick={onClose}></div>
                        <div className="control minimize"></div>
                        <div className="control maximize"></div>
                    </div>
                    <div className="modal-title">
                        {formData.id ? 'Edit Plan' : 'New Plan'}
                        <p className="modal-subtitle">
                            {formData.id ? 'Update existing plan details' : 'Create a new pricing plan'}
                        </p>
                    </div>
                </div>
                
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <div className="field">
                                <label>Plan Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleChange}
                                    placeholder="e.g. Freelancer"
                                    autoFocus
                                />
                            </div>
                            <div className="field">
                                <label>Price ($ Monthly)</label>
                                <input 
                                    type="number" 
                                    name="price"
                                    value={formData.price} 
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div className="field">
                                <label>Features (One per line)</label>
                                <textarea 
                                    value={featuresString} 
                                    onChange={handleFeaturesChange}
                                    placeholder="20GB Storage&#10;Basic Support"
                                />
                            </div>
                            <div className="field">
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        name="active"
                                        checked={formData.active} 
                                        onChange={handleChange}
                                    />
                                    Active Status
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="actions">
                    <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
                    <button type="button" className="button primary icon save" onClick={handleSubmit}>
                        {formData.id ? 'Save Changes' : 'Create Plan'}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default PricingPlanModal;
