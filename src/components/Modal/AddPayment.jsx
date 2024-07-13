import React, { useEffect, useState } from 'react';
import { addCollection, addPayment } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { closeModal, selectModal } from '../../app/slices/modalSlice';

function AddPaymentModal({ project }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal)
  const onClose = () => dispatch(closeModal('addPayment'))
  const [paymentData, setPaymentData] = useState({
    name: 'Advance',
    amount: 0,
    status: 'empty'
  });
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setPaymentData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
  };
  const handleSubmit = () => {
    
    dispatch(addPayment({ projectId: project.id, paymentData: paymentData }))
    .then((data)=>{
    console.log(data.payload)
      
      dispatch(showAlert({type:'success', message:`<b>${paymentData.name}</b> payment added successfully!`}));
    })
    onClose();
  };

  if (!visible.addPayment) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="modal add-payment">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>onClose()}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Add Payment</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            <div className="field">
              <label className="" htmlFor="">Name</label>
              <input className="" name="name" value={paymentData.name} type="text" onChange={handleInputChange}/>
            </div>
            <div className="field">
              <label className="" htmlFor="">Amount</label>
              <input className="" name="amount" value={paymentData.amount} type="text" onChange={handleInputChange}/>
            </div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={()=>onClose()}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={()=>onClose()}></div>
    </div>
  );
}

export default AddPaymentModal


function convertToSlug(inputString) {
  // Replace spaces with hyphens and convert to lowercase
  return inputString.replace(/\s+/g, '-').toLowerCase();
}