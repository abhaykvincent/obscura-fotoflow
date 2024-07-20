import React, { useState, useEffect } from 'react';
import { addPayment } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import { formatDecimal } from '../../utils/stringUtils';

function AddPaymentModal({ project }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const onClose = () => dispatch(closeModal('addPayment'));
  
  const [paymentData, setPaymentData] = useState({
    name: 'Advance',
    amount: 15000
  });
  const existingPaymentsTotal = project.payments.reduce((sum, payment) => sum + parseInt(payment.amount), 0);
  let balance = project.budgets?.amount - existingPaymentsTotal;


  const [aiSuggestions, setAISuggestions] = useState(
    {
      amount: [15000,30000,45000,60000,120000],
      name: ['Advance','Balance']
    }
  );
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!paymentData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (paymentData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (paymentData.amount > project.budgets?.amount - existingPaymentsTotal) {
      newErrors.amount = "Amount exceeds balance.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;validateForm()
    setPaymentData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleAISuggestionChange = (amount) => {
    validateForm()
    setPaymentData(prevData => ({
      ...prevData,
      amount
    }))
  }
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

  useEffect(()=> {
    validateForm()
  },[paymentData])

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
            {/* AI suggested */}
          <div className="field ai-suggestion">
              <label htmlFor="amount">AI✨  </label>
              <div className="ai-suggestions">

                {
                  aiSuggestions.name.map((suggestion, index) => {
                    return (
                      <div className="tag button tertiary suggestion"
                      onClick={() => handleAISuggestionChange(suggestion)}
                      key={index}
                      >{suggestion}</div>
                    )
                  })
                }
            </div>
            </div>
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
          {/* AI suggested */}
          <div className="field ai-suggestion">
              <label htmlFor="amount">✨ AI </label>
              <div className="ai-suggestions">

              {
          aiSuggestions.amount
            .filter(suggestion => suggestion <= balance) // Filter suggestions based on balance
            .map((suggestion, index) => {
              return (
                <div className="tag button tertiary suggestion"
                  onClick={() => handleAISuggestionChange(suggestion)}
                  key={index}
                >
                  {formatDecimal(suggestion)}
                </div>
              )
            })
        }
            </div>
            </div>
          <div className="field">
            <div className="div"></div>
            <PaymentVisualization budget={project.budgets} newPayment={paymentData} payments={project.payments} />
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

function PaymentVisualization({newPayment,budget,payments}) {
  const totalWidth = 300; // SVG width
  const height = 4; // SVG height

  //const existingPaymentsTotal = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const budgetAmount = budget.amount;
  const existingPaymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  // convert newPayment in numbers to percentage of totalAmount 
  const newPaymentAmount = newPayment.isPercentage? (newPayment.percentage / 100) * budgetAmount : newPayment.amount

  const existingPaymentsWidth = (existingPaymentsTotal / budgetAmount) * totalWidth;
  const newPaymentWidth = (newPaymentAmount / budgetAmount) * totalWidth;
  const remainingWidth = totalWidth - existingPaymentsWidth - newPaymentWidth;
  const remainingWidthPercentage = (remainingWidth / 100) * 100;
  console.log({existingPaymentsWidth,newPaymentWidth,remainingWidth})

  return (
  <>
  
    <svg width={'100%'} height={height + 8*5}>
      <text x="80%" y="10" height={8} width={existingPaymentsWidth} fill="#777" fontSize={12} >${budgetAmount}</text>

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

  // Line complexity 2.0 -> 