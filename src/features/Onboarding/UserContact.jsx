import React, { useEffect, useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

const UserContact = ({ active, next, createAccountData, updateAccountData, user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [contactNumber, setContactNumber] = useState('');
  const [inputMessage, setInputMessage] = useState({}); // State to track validation error messages



    useEffect(() => {
      let number = contactNumber
      const handler = setTimeout(() => {
        // Validate the number while typing
        // Basic validation for a 10-digit phone number
        const phoneRegex =/^\d{10}$/;
        if (!phoneRegex.test(number)) {
          if(number.length > 10) {
            setInputMessage({
              message:'Oops! Looks like your phone number is a bit long',
              type:'error',
              value: 'medium'
            });
          } else if (number && number.length < 10) {
            setInputMessage({
              message:'Hmm, your phone number seems a bit short',
              type:'error',
              value: 'low'});

          }
        } 
        else {
          setInputMessage({
            message:'Perfect!',
            type:'success',
            value: 'medium'});
        }
      }, 10);
  
      return () => {
        clearTimeout(handler);
      };
    }, [contactNumber]);

  const handleContactNumberChange = (e) => {
    const number = e.target.value;
    setContactNumber(number);

    
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!contactNumber) {
      setInputMessage({
          message:'Please enter your phone number',
          type:'error',
          value: 'low'
        })
      return;
    }

    updateAccountData({ contactNumber });
    if (user.email) next();
  };

  if (!active) {
    return null;
  }

  return (
    <div className={`screen user-contact`}>
      <h2 className='screen-title'>Contact Number</h2>
      <p className='section-intro'>
        What's your WhatsApp Number?
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="tel"
            id="contactNumber"
            value={contactNumber}
            onChange={handleContactNumberChange}
            placeholder='+91 0000 000000'
            required
          />
          {inputMessage.message && <p className={`message ${inputMessage.type} ${inputMessage.value}`}>{inputMessage.message}</p>} {/* Render error message */}
        </div>
        <div
          className={`button primary large ${!user.email || inputMessage.type !=='success' ? 'disabled' : ''}`}
          onClick={handleSubmit}
        >
          Open App
        </div>
      </form>
    </div>
  );
};

export default UserContact;
