import React, { useState, useEffect } from 'react';
import { addExpense, addPayment } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import { formatDecimal } from '../../utils/stringUtils';

function AddExpenseModal({ project }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const onClose = () => dispatch(closeModal('addExpense'));
  
  

  const [aiSuggestions, setAISuggestions] = useState(
    {
      amount: [15000,30000,45000,60000,120000],
      name: ['Photographer','Videographer','Assistant','Designer','Print House']
    }
  );
  const [expenseData, setPaymentData] = useState({
    name: 'Photographer',
    amount: 15000
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!expenseData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (expenseData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    validateForm()
    setPaymentData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleAISuggestionChange = (field,value) => {
    validateForm()
    setPaymentData(prevData => ({
      ...prevData,
      [field]:value
    }))
  }
  const handleSubmit = () => {
    if (validateForm()) {
      dispatch(addExpense({ projectId: project.id, paymentData:expenseData }))
        .then((data) => {
          dispatch(showAlert({type:'success', message:`<b>${expenseData.name}</b> payment added successfully!`}));
          onClose();
        })
        .catch((error) => {
          dispatch(showAlert({type:'error', message: 'Failed to add payment. Please try again.'}));
        });
    }
  };

  useEffect(()=> {
    validateForm()
  },[expenseData])

  if (!visible.addExpense) return null;

  return (
    <div className="modal-container">
      <div className="modal add-payment">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Add Expenses</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input 
              id="name" 
              name="name" 
              value={expenseData.name} 
              type="text" 
              onChange={handleInputChange}
            />
          </div>
          {errors.name && <div className="error">{errors.name}</div>}
          {/* AI suggested */}
          <div className="field ai-suggestion">
            <label className='ai-label' htmlFor="amount">AI✨  </label>
            <div className="ai-suggestions">
              {
                aiSuggestions.name.map((suggestion, index) => {
                  return (
                    <div className="tag button tertiary suggestion"
                    onClick={() => handleAISuggestionChange('name',suggestion)}
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
              value={expenseData.amount}
              type="number"
              onChange={handleInputChange}
            />
          </div>
          {errors.amount && <div className="error">{errors.amount}</div>}
          {/* AI suggested */}
          <div className="field ai-suggestion">
              <label className='ai-label' htmlFor="amount">✨ AI </label>
              <div className="ai-suggestions">

              {
          aiSuggestions.amount
            .filter(suggestion => suggestion != 0) // Filter suggestions based on balance
            .map((suggestion, index) => {
              return (
                <div className="tag button tertiary suggestion"
                  onClick={() => handleAISuggestionChange('amount',suggestion)}
                  key={index}
                >
                  {formatDecimal(suggestion)}
                </div>
              )
            })
        }
            </div>
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

export default AddExpenseModal;

  // Line complexity 2.0 -> 1.5