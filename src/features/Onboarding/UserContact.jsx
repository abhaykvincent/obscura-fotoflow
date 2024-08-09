import React, { useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

const UserContact = ({active,next,createAccountData,updateAccountData}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [contactNumber, setContactNumber] = useState('');

  const handleContactNumberChange = (e) => {
    const name = e.target.value;
    setContactNumber(name);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    updateAccountData({contactNumber})
    next()
  };

  if (!active) {
    return null;
  }

  return (

    <div className={`screen user-contact `}>
      <h2 className='screen-title'>Contact Number</h2>
      <p className='section-intro'>
        What's is your Whatsapp Number?
         </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            id="contactNumber"
            value={contactNumber}

            onChange={handleContactNumberChange}
            placeholder='+91 0000 000000'
            /* onChange={(e) => setVontactNumber(e.target.value)} */
            required
          />
        </div>
        <div className="button tertiary large" onClick={next} >Skip</div>
        <div className="button primary large"
          onClick={handleSubmit}
        >Open App</div>
      </form>
    </div>
  );
};

export default UserContact;
