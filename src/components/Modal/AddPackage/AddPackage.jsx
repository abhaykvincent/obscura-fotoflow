import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../../app/slices/modalSlice';
import { addPackage } from '../../../app/slices/packagesSlice';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { showAlert } from '../../../app/slices/alertSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import TemplateSelection from './TemplateSelection';
import PackageDetails from './PackageDetails';
import './AddPackage.scss';

const initialPackageData = {
  template: '',
  name: '',
  description: '',
  tiers: [
    { name: 'Standard', price: '', services: [''] },
  ],
};

function AddPackageModal() {
  const dispatch = useDispatch();
  const { createPackage: isVisible } = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);
  const [packageData, setPackageData] = useState(initialPackageData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const modalRef = useModalFocus(isVisible);

  const onClose = () => dispatch(closeModalWithAnimation('createPackage'));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPackageData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !packageData.template) {
      setErrors({ template: 'Please select a template' });
      return;
    }
    setErrors({});
    setCurrentStep(2);
  };

  const handlePreviousStep = () => setCurrentStep(1);

  const handleSubmit = async () => {
    // Validation logic here
    const domain = currentStudio.domain;
    onClose();
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await dispatch(addPackage({ domain, packageData })).unwrap();
      dispatch(showAlert({ type: 'success', message: 'Package created successfully!' }));
    } catch (error) {
      console.error('Error creating package:', error);
      dispatch(showAlert({ type: 'error', message: 'Failed to create package.' }));
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
            {currentStep === 1 ? 'Create Package' : 'Package Details'}
            <p className="modal-subtitle">{currentStep === 1 ? 'Choose a template' : packageData.template}</p>
          </div>
        </div>
        <div className="modal-body">
          {currentStep === 1 ? (
            <TemplateSelection
              packageData={packageData}
              setPackageData={setPackageData}
              errors={errors}
            />
          ) : (
            <PackageDetails
              packageData={packageData}
              setPackageData={setPackageData}
              handleInputChange={handleInputChange}
              errors={errors}
            />
          )}
        </div>
        <div className="actions">
          {currentStep === 1 && <button type="button" className="button secondary" onClick={onClose}>Cancel</button>}
          {currentStep > 1 && <button type="button" className="button secondary" onClick={handlePreviousStep}>Back</button>}
          {currentStep < 2 ? (
            <button type="button" className="button primary" onClick={handleNextStep}>Next</button>
          ) : (
            <button type="button" className="button primary" onClick={handleSubmit}>Create Package</button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddPackageModal;