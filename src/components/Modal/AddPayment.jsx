import React, { useState, useEffect } from 'react';
import { addPayment } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, selectModal } from '../../app/slices/modalSlice';

function AddPaymentModal({ project }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const onClose = () => dispatch(closeModal('addPayment'));
  
  const [paymentData, setPaymentData] = useState({
    name: 'Advance',
    amount: null
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!paymentData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (paymentData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPaymentData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSubmit = () => {
    if (validateForm()) {
      dispatch(addPayment({ projectId: project.id, paymentData }))
        .then((data) => {
          dispatch(showAlert({type:'success', message:`<b>${paymentData.name}</b> payment added successfully!`}));
          onClose();
        })
        .catch((error) => {
          dispatch(showAlert({type:'error', message: 'Failed to add payment. Please try again.'}));
        });
    }
  };

  if (!visible.addPayment) return null;

  return (
    <div className="modal-container">
      <div className="modal add-payment">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Add Payment</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input 
              id="name" 
              name="name" 
              value={paymentData.name} 
              type="text" 
              onChange={handleInputChange}
            />
          </div>
            {errors.name && <div className="error">{errors.name}</div>}
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              className='symbol'
              value={paymentData.amount}
              type="number"
              onChange={handleInputChange}
            />
          </div>
          {errors.amount && <div className="error">{errors.amount}</div>}
            <div className="field">
              <div className="div"></div>
              <PaymentVisualization project={project} newPayment={paymentData} />
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddPaymentModal;

function PaymentVisualization({newPayment}) {
  const totalWidth = 300; // SVG width
  const height = 4; // SVG height

  //const existingPaymentsTotal = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAmount = 10000;
  const existingPaymentsTotal = 5000
  // convert newPayment in numbers to percentage of totalAmount 
  const newPaymentAmount = newPayment.isPercentage? (newPayment.percentage / 100) * totalAmount : newPayment.amount

  const existingPaymentsWidth = (existingPaymentsTotal / totalAmount) * totalWidth;
  const newPaymentWidth = (newPaymentAmount / totalAmount) * totalWidth;
  const remainingWidth = totalWidth - existingPaymentsWidth - newPaymentWidth;
  const remainingWidthPercentage = (remainingWidth / 100) * 100;
  console.log({existingPaymentsWidth,newPaymentWidth,remainingWidth})

  return (
  <>
  
    <svg width={'100%'} height={height + 8*5}>
      <text x="80%" y="10" height={8} width={existingPaymentsWidth} fill="#777" fontSize={12} >${totalAmount}</text>

      <rect x="0" y="20" width={existingPaymentsWidth} height={height} fill="#4CAF50" />
      <text x={0} y="36" width={existingPaymentsWidth} fill="#777" fontSize={12} >${existingPaymentsTotal}</text>

      <rect x={existingPaymentsWidth} y="20" width={newPaymentWidth}  height={height} fill="#eee" />
      <text x={existingPaymentsWidth} y="35" width={newPaymentWidth}  fontSize={12} fill="#777" >{newPaymentAmount>2&&`${newPaymentWidth.toFixed(0)}%`}</text>
      
      <rect x={existingPaymentsWidth + newPaymentWidth} y="20" width={remainingWidthPercentage} height={height} fill="#444" />
      <text x={'85%'} y="35" fontSize={12}  width={'16'} fill="#777">${remainingWidth.toFixed(0)}</text>
    </svg>
  </>
  );
}