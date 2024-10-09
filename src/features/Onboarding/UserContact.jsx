import React, { useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

const UserContact = ({active,next,createAccountData,updateAccountData,user}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [contactNumber, setContactNumber] = useState('');
  console.log(user)
  const handleContactNumberChange = (e) => {
    const name = e.target.value;
    setContactNumber(name);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    updateAccountData({contactNumber})
    if(user.email)
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
        <div className={`button primary large ${!user.email ? 'disabled' : ''}`}
          onClick={handleSubmit}
        >Open App</div>
      </form>
    </div>
  );
};

export default UserContact;
