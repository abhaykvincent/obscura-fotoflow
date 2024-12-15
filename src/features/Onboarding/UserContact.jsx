import React, { useEffect, useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import PrivacyPolicy from '../PrivacyPolicy/PrivacyPolicy';
import { openModal } from '../../app/slices/modalSlice';

const UserContact = ({ active, next,previous,createAccountData, updateAccountData, user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [contactNumber, setContactNumber] = useState('');
  const [inputMessage, setInputMessage] = useState({}); // State to track validation error messages

  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const agreePolicy = () => {
    setPrivacyPolicyAgreed(true);
  };
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
    <>
    
    <PrivacyPolicy agreePolicy={agreePolicy}/>
    <div className={`screen user-contact`}>
      <div className="screen-title">
        <div className="back-form"
          onClick={previous}
        ></div>
        <h2 className=''>Contact Number</h2>
      </div>
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

        <div className="privacy-policy-statment">
            <input type="checkbox" id="privacyPolicy" name="privacyPolicy" required value={privacyPolicyAgreed} onChange={()=>{
              setPrivacyPolicyAgreed(!privacyPolicyAgreed)
            }}/>
            <label >
              I agree to the <span
                onClick={()=>{
                  dispatch(openModal('privacyPolicy'))
                }}
              >Terms of Service</span> and <span
                onClick={()=>{
                  dispatch(openModal('privacyPolicy'))
                }}
              >Privacy Policy</span>
            </label>
          </div>
        <div
          className={`button primary large ${!user.email || inputMessage.type !=='success' ? 'disabled' : ''}`}
          onClick={handleSubmit}
        >
          Open App
        </div>
      </form>
    </div>
    </>
  );
};

export default UserContact;
