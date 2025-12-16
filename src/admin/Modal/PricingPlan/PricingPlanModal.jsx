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

const STEPS = [
    { id: 'general', label: 'General Info' },
    { id: 'pricing', label: 'Pricing & Billing' },
    { id: 'limits', label: 'Usage Limits' },
    { id: 'features', label: 'Features & Flags' },
    { id: 'ui', label: 'Presentation' }
];

const PLAN_SUGGESTIONS = ['Core', 'Freelancer', 'Studio', 'Agency', 'Enterprise', 'Starter', 'Professional', 'Business'];

const DEFAULT_PLAN = {
    id: null,
    name: '',
    slug: '',
    description: '',
    type: 'public',
    status: 'active',
    sortOrder: 0,
    pricing: {
        currency: 'INR',
        tiers: [
             { interval: 'month', price: 0, razorpayPlanId: '' },
             { interval: 'year', price: 0, razorpayPlanId: '', discountLabel: '2 Months Free' }
        ],
        trialPeriodDays: 14,
        setupFee: 0
    },
    limits: {
        storageGb: 5,
        maxProjects: 10,
        maxGalleries: -1,
        maxTeamMembers: 1,
        fileUploadSizeMb: 1000,
        bandwidthGb: 50
    },
    features: {
        permissions: {
            canRemoveBranding: false,
            canUseCustomDomain: false,
            hasApiAccess: false,
            hasPrioritySupport: false,
            allowVideoUploads: false
        },
        displayList: []
    },
    ui: {
        colorTheme: '#4f46e5',
        badgeText: '',
        highlight: false,
        ctaText: 'Start Trial'
    },
    // Backwards compatibility
    active: true 
};

// Simple slugify function
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};

const PricingPlanModal = () => {
    const dispatch = useDispatch();
    const { managePricingPlan: isVisible } = useSelector(selectModal);
    const editingPlan = useSelector(selectEditingPricingPlan);
    const pricingGroups = useSelector(selectPricingGroups);
    const modalRef = useModalFocus(isVisible);

    const [activeStep, setActiveStep] = useState('general');
    const [formData, setFormData] = useState(JSON.parse(JSON.stringify(DEFAULT_PLAN)));
    const [isSlugEdited, setIsSlugEdited] = useState(false);

    // Initialize state when modal opens
    useEffect(() => {
        if (isVisible) {
            setActiveStep('general');
            setIsSlugEdited(false); // Reset on open
            if (editingPlan) {
                // Merge default plan with editing plan to ensure new fields exist
                const mergedPlan = {
                    ...DEFAULT_PLAN,
                    ...editingPlan,
                    pricing: { ...DEFAULT_PLAN.pricing, ...editingPlan.pricing },
                    limits: { ...DEFAULT_PLAN.limits, ...editingPlan.limits },
                    features: { 
                        ...DEFAULT_PLAN.features, 
                        ...editingPlan.features,
                        permissions: { ...DEFAULT_PLAN.features.permissions, ...(editingPlan.features?.permissions || {}) }
                    },
                    ui: { ...DEFAULT_PLAN.ui, ...editingPlan.ui }
                };

                // Handle legacy features array -> displayList
                if (Array.isArray(editingPlan.features)) {
                    mergedPlan.features.displayList = editingPlan.features.map(f => ({ text: f }));
                }

                // Handle legacy price -> monthly tier
                if (typeof editingPlan.price === 'number') {
                    const monthTier = mergedPlan.pricing.tiers.find(t => t.interval === 'month');
                    if (monthTier) monthTier.price = editingPlan.price;
                }

                setFormData(mergedPlan);
                if (editingPlan.slug) setIsSlugEdited(true); // If editing existing, assume slug is set
            } else {
                setFormData(JSON.parse(JSON.stringify(DEFAULT_PLAN)));
            }
        }
    }, [isVisible, editingPlan]);

    const onClose = () => {
        dispatch(closeModalWithAnimation('managePricingPlan'));
    };

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        const group = pricingGroups.find(g => g.id === formData.groupId);
        const groupName = group ? group.name : '';
        
        setFormData(prev => {
            const newState = { ...prev, name: newName };
            if (!isSlugEdited) {
                // Auto generate slug if not manually edited
                // Format: groupname-planname
                const combined = groupName ? `${groupName} ${newName}` : newName;
                newState.slug = slugify(combined);
            }
            return newState;
        });
    };

    const handleSlugChange = (e) => {
        setFormData(prev => ({ ...prev, slug: e.target.value }));
        setIsSlugEdited(true);
    };

    const handleLimitChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            limits: {
                ...prev.limits,
                [key]: Number(value)
            }
        }));
    };

    const handlePermissionChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                permissions: {
                    ...prev.features.permissions,
                    [key]: value
                }
            }
        }));
    };

    const handleTierChange = (index, field, value) => {
        const newTiers = [...formData.pricing.tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        handleNestedChange('pricing', 'tiers', newTiers);
    };

    const addDisplayListItem = () => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                displayList: [...prev.features.displayList, { text: '', tooltip: '' }]
            }
        }));
    };

    const updateDisplayListItem = (index, field, value) => {
        const newList = [...formData.features.displayList];
        newList[index] = { ...newList[index], [field]: value };
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                displayList: newList
            }
        }));
    };

    const removeDisplayListItem = (index) => {
        const newList = formData.features.displayList.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                displayList: newList
            }
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.groupId) return;

        const group = pricingGroups.find(g => g.id === formData.groupId);
        if (!group) return;

        // Flatten for legacy compatibility where needed, but keep rich structure
        const finalPlan = {
            ...formData,
            // Keep legacy top-level price for now (take monthly)
            price: formData.pricing.tiers.find(t => t.interval === 'month')?.price || 0,
            // Keep legacy top-level features array
            features: formData.features.displayList.map(item => item.text),
            active: formData.status === 'active'
        };

        const { groupId, ...planData } = finalPlan;

        let updatedPlans;
        if (planData.id) {
            updatedPlans = group.plans.map(p => p.id === planData.id ? planData : p);
        } else {
            const newPlan = { ...planData, id: `plan_${Date.now()}` };
            updatedPlans = [...group.plans, newPlan];
        }

        await dispatch(updatePricingGroupAsync({ id: groupId, updates: { plans: updatedPlans } }));
        onClose();
    };

    // --- RENDER STEPS ---

    const renderGeneral = () => (
        <div className="form-section">
            <div className="field">
                <label>Plan Name</label>
                <input 
                    type="text" 
                    value={formData.name} 
                    onChange={handleNameChange}
                    placeholder="e.g. Pro Studio"
                    list="plan-name-suggestions"
                    autoFocus
                />
                <datalist id="plan-name-suggestions">
                    {PLAN_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
            </div>
            <div className="form-row">
                <div className="field">
                    <label>Slug (URL Friendly)</label>
                    <input 
                        type="text" 
                        value={formData.slug} 
                        onChange={handleSlugChange}
                        placeholder="e.g. corporate-pro-studio"
                    />
                    <p style={{fontSize: '0.75rem', color: '#666', marginTop: '4px'}}>
                        Auto-generated from Group Name + Plan Name unless manually edited.
                    </p>
                </div>
                <div className="field">
                    <label>Sort Order</label>
                    <input 
                        type="number" 
                        value={formData.sortOrder} 
                        onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})}
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="field">
                    <label>Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="public">Public</option>
                        <option value="custom">Custom (Hidden)</option>
                        <option value="legacy">Legacy</option>
                    </select>
                </div>
                <div className="field">
                    <label>Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>
            <div className="field">
                <label>Description</label>
                <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Short description for the pricing card..."
                />
            </div>
        </div>
    );

    const renderPricing = () => (
        <div className="form-section">
            <div className="form-row">
                <div className="field">
                    <label>Currency</label>
                    <select 
                        value={formData.pricing.currency} 
                        onChange={e => handleNestedChange('pricing', 'currency', e.target.value)}
                    >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
                <div className="field">
                    <label>Trial Period (Days)</label>
                    <input 
                        type="number" 
                        value={formData.pricing.trialPeriodDays} 
                        onChange={e => handleNestedChange('pricing', 'trialPeriodDays', Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="field">
                <label>Pricing Tiers</label>
                <div className="tiers-list">
                    {formData.pricing.tiers.map((tier, idx) => (
                        <div key={idx} className="tier-item">
                            <div>
                                <span className="sub-label">Interval</span>
                                <select 
                                    value={tier.interval}
                                    onChange={e => handleTierChange(idx, 'interval', e.target.value)}
                                >
                                    <option value="month">Monthly</option>
                                    <option value="year">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <span className="sub-label">Price</span>
                                <input 
                                    type="number" 
                                    value={tier.price} 
                                    onChange={e => handleTierChange(idx, 'price', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <span className="sub-label">Razorpay Plan ID</span>
                                <input 
                                    type="text" 
                                    value={tier.razorpayPlanId} 
                                    onChange={e => handleTierChange(idx, 'razorpayPlanId', e.target.value)}
                                    placeholder="plan_..."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderLimits = () => (
        <div className="form-section">
            <p style={{color: '#888', fontSize: '0.9em'}}>Set -1 for Unlimited.</p>
            <div className="form-row">
                <div className="field">
                    <label>Storage (GB)</label>
                    <input type="number" value={formData.limits.storageGb} onChange={e => handleLimitChange('storageGb', e.target.value)} />
                </div>
                <div className="field">
                    <label>Bandwidth (GB/mo)</label>
                    <input type="number" value={formData.limits.bandwidthGb} onChange={e => handleLimitChange('bandwidthGb', e.target.value)} />
                </div>
            </div>
            <div className="form-row">
                <div className="field">
                    <label>Max Projects</label>
                    <input type="number" value={formData.limits.maxProjects} onChange={e => handleLimitChange('maxProjects', e.target.value)} />
                </div>
                <div className="field">
                    <label>Max Team Members</label>
                    <input type="number" value={formData.limits.maxTeamMembers} onChange={e => handleLimitChange('maxTeamMembers', e.target.value)} />
                </div>
            </div>
            <div className="form-row">
                <div className="field">
                    <label>Upload Limit (MB)</label>
                    <input type="number" value={formData.limits.fileUploadSizeMb} onChange={e => handleLimitChange('fileUploadSizeMb', e.target.value)} />
                </div>
                <div className="field">
                    <label>Max Galleries</label>
                    <input type="number" value={formData.limits.maxGalleries} onChange={e => handleLimitChange('maxGalleries', e.target.value)} />
                </div>
            </div>
        </div>
    );

    const renderFeatures = () => (
        <div className="form-section">
            <h3>Permissions</h3>
            <div className="permissions-grid">
                {Object.keys(formData.features.permissions).map(key => (
                    <div 
                        key={key} 
                        className={`checkbox-card ${formData.features.permissions[key] ? 'checked' : ''}`}
                        onClick={() => handlePermissionChange(key, !formData.features.permissions[key])}
                    >
                        <input 
                            type="checkbox" 
                            checked={formData.features.permissions[key]} 
                            onChange={() => {}} // Handled by div click
                        />
                        <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                    </div>
                ))}
            </div>

            <h3 style={{marginTop: '20px'}}>Marketing Display List</h3>
            <div className="display-list-builder">
                {formData.features.displayList.map((item, idx) => (
                    <div key={idx} className="list-item">
                        <input 
                            type="text" 
                            value={item.text} 
                            onChange={e => updateDisplayListItem(idx, 'text', e.target.value)}
                            placeholder="Feature description (e.g. '1TB Storage')"
                        />
                        <div className="remove-btn" onClick={() => removeDisplayListItem(idx)}>✕</div>
                    </div>
                ))}
                <button type="button" className="button secondary small" onClick={addDisplayListItem}>+ Add Feature Bullet</button>
            </div>
        </div>
    );

    const renderUI = () => (
        <div className="form-section">
            <div className="field">
                <label>Color Theme</label>
                <div className="color-picker-row">
                    {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'].map(color => (
                        <div 
                            key={color} 
                            className={`color-swatch ${formData.ui.colorTheme === color ? 'selected' : ''}`}
                            style={{backgroundColor: color}}
                            onClick={() => handleNestedChange('ui', 'colorTheme', color)}
                        />
                    ))}
                </div>
            </div>
            <div className="field">
                <label>Badge Text (Ribbon)</label>
                <input 
                    type="text" 
                    value={formData.ui.badgeText || ''} 
                    onChange={e => handleNestedChange('ui', 'badgeText', e.target.value)}
                    placeholder="e.g. Most Popular"
                />
            </div>
            <div className="field">
                <label>CTA Button Text</label>
                <input 
                    type="text" 
                    value={formData.ui.ctaText} 
                    onChange={e => handleNestedChange('ui', 'ctaText', e.target.value)}
                    placeholder="Start Free Trial"
                />
            </div>
            <div 
                className={`checkbox-card ${formData.ui.highlight ? 'checked' : ''}`} 
                style={{maxWidth: '300px', border: '1px solid rgba(255,255,255,0.1)', padding: '10px'}}
                onClick={() => handleNestedChange('ui', 'highlight', !formData.ui.highlight)}
            >
                <input type="checkbox" checked={formData.ui.highlight} onChange={() => {}} />
                <label>Highlight Card (Scale Up)</label>
            </div>
        </div>
    );

    if (!isVisible) return null;

    return (
        <div className="modal-container" ref={modalRef}>
            <div className="modal pricing-plan-modal island">
                <div className="modal-header">
                    <div className="modal-controls">
                        <div className="control close" onClick={onClose}></div>
                    </div>
                    <div className="modal-title">
                        {formData.id ? 'Edit Plan' : 'New Plan'}
                        <p className="modal-subtitle">
                            {formData.name || 'Untitled Plan'}
                        </p>
                    </div>
                </div>
                
                <div className="modal-body">
                    <div className="modal-sidebar">
                        {STEPS.map(step => (
                            <div 
                                key={step.id} 
                                className={`sidebar-item ${activeStep === step.id ? 'active' : ''}`}
                                onClick={() => setActiveStep(step.id)}
                            >
                                <span className="step-number">{STEPS.indexOf(step) + 1}</span>
                                {step.label}
                            </div>
                        ))}
                    </div>

                    <div className="modal-content-area">
                        {activeStep === 'general' && renderGeneral()}
                        {activeStep === 'pricing' && renderPricing()}
                        {activeStep === 'limits' && renderLimits()}
                        {activeStep === 'features' && renderFeatures()}
                        {activeStep === 'ui' && renderUI()}
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
                    <div style={{display: 'flex', gap: '10px'}}>
                        {STEPS.findIndex(s => s.id === activeStep) > 0 && (
                            <button className="button secondary" onClick={() => setActiveStep(STEPS[STEPS.findIndex(s => s.id === activeStep) - 1].id)}>
                                Back
                            </button>
                        )}
                        {STEPS.findIndex(s => s.id === activeStep) < STEPS.length - 1 ? (
                            <button className="button primary" onClick={() => setActiveStep(STEPS[STEPS.findIndex(s => s.id === activeStep) + 1].id)}>
                                Next
                            </button>
                        ) : (
                            <button type="button" className="button primary icon save" onClick={handleSubmit}>
                                {formData.id ? 'Save Changes' : 'Create Plan'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default PricingPlanModal;
