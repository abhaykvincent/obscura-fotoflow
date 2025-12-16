import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import './PricingGroupModal.scss';

const PricingGroupModal = ({ initialData, onSave }) => {
    const dispatch = useDispatch();
    const { managePricingGroup: isVisible } = useSelector(selectModal);
    const modalRef = useModalFocus(isVisible);

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        description: ''
    });
    
    // Update form data when initialData changes or modal opens
    useEffect(() => {
        if (isVisible && initialData) {
            setFormData(initialData);
        } else if (isVisible && !initialData) {
            // Reset for new entry if no initial data provided (though parent usually handles this)
            setFormData({
                id: null,
                name: '',
                description: ''
            });
        }
    }, [isVisible, initialData]);

    const onClose = () => {
        dispatch(closeModalWithAnimation('managePricingGroup'));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        onSave(formData);
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className="modal-container" ref={modalRef}>
            <div className="modal pricing-group-modal island">
                <div className="modal-header">
                    <div className="modal-controls">
                        <div className="control close" onClick={onClose}></div>
                        <div className="control minimize"></div>
                        <div className="control maximize"></div>
                    </div>
                    <div className="modal-title">
                        {formData.id ? 'Edit Pricing Group' : 'New Pricing Group'}
                        <p className="modal-subtitle">
                            {formData.id ? 'Update existing pricing tier details' : 'Create a new pricing tier configuration'}
                        </p>
                    </div>
                </div>
                
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <div className="field">
                                <label>Group Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleChange}
                                    placeholder="e.g. Corporate Pricing 2024"
                                    autoFocus
                                />
                            </div>
                            <div className="field">
                                <label>Description</label>
                                <textarea 
                                    name="description"
                                    value={formData.description || ''} 
                                    onChange={handleChange}
                                    placeholder="Optional description for this pricing group"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="actions">
                    <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
                    <button type="button" className="button primary icon save" onClick={handleSubmit}>
                        {formData.id ? 'Save Changes' : 'Create Group'}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
};

export default PricingGroupModal;
