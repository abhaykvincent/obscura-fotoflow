import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { addPackage } from '../../../app/slices/packagesSlice';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { showAlert } from '../../../app/slices/alertSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import './AddPackage.scss';

function AddPackageModal() {
  const dispatch = useDispatch();
  const { createPackage: isVisible } = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);
  const [packageName, setPackageName] = useState('');
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);
  const modalRef = useModalFocus(isVisible);

  const onClose = () => dispatch(closeModalWithAnimation("createPackage"));

  const handleInputChange = (event) => {
    setPackageName(event.target.value);
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!packageName.trim()) {
      setError('Package name is required');
      nameInputRef.current?.focus();
      return;
    }

    const domain = currentStudio.domain;
    onClose();

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      await dispatch(addPackage({ domain, packageData: { name: packageName } })).unwrap();
      dispatch(showAlert({ type: "success", message: `Package created successfully!` }));
    } catch (error) {
      console.error(`Error creating package:`, error);
      dispatch(showAlert({ type: "error", message: `Failed to create package.` }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal create-package island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">
            Create Package
            <p className="modal-subtitle">New Package</p>
          </div>
        </div>
        <div className="modal-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="form-group">
              <label htmlFor="packageName">Package Name</label>
              <input
                type="text"
                id="packageName"
                name="packageName"
                ref={nameInputRef}
                value={packageName}
                onChange={handleInputChange}
                placeholder="Enter package name"
              />
              {error && <p className="error-message">{error}</p>}
            </div>
          </form>
        </div>
        <div className="actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="button primary" onClick={handleSubmit}>Create Package</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddPackageModal;
