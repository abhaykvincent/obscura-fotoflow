import React, { useState, useEffect } from 'react';
import { addBudget, addPayment } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import { formatDecimal } from '../../utils/stringUtils';

export default function AddBudgetModal({ project }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const onClose = () => dispatch(closeModal('addBudget'));
  
  const [budgetData, setBudgetData] = useState({
    amount: null
  });

  // ai suggestion for budget amounnt
  const [aiSuggestions, setAISuggestions] = useState([
    {amount: 15000},
    {amount: 30000},
    {amount: 45000},
    {amount: 60000},
  ]);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (budgetData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBudgetData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleAISuggestionChange = (amount) => {
    setBudgetData(prevData => ({
      ...prevData,
      amount
    }))
  }
  const handleSubmit = () => {
    if (validateForm()) {
      dispatch(addBudget({ projectId: project.id, budgetData }))
        .then((data) => {
          const {budgetData} = data.payload;
          console.log(budgetData)
          dispatch(showAlert({type:'success', message:` Budget set to <b>${formatDecimal(budgetData.amount)}</b>!`}));
          onClose();
        })
        .catch((error) => {
          dispatch(showAlert({type:'error', message: 'Failed to add Budget. Please try again.'}));
        });
    }
  };
  if (!visible.addBudget) return null;

  return (
    <div className="modal-container">
      <div className="modal add-payment">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Set Budget</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              className='bigger symbol'
              value={budgetData.amount}
              type="number"
              onChange={handleInputChange}
            />
          </div>
          {errors.amount && <div className="error">{errors.amount}</div>}
          {/* AI suggested */}
          <div className="field">
            <label className='ai-label' htmlFor="amount">AI Suggested</label>
            <div className="ai-suggestions">

              {
                aiSuggestions.map((suggestion, index) => {
                  return (
                    <div className="tag button tertiary suggestion"
                    onClick={() => handleAISuggestionChange(suggestion.amount)}
                    key={index}
                    >{formatDecimal(suggestion.amount)}</div>
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
