import React, { useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { update } from 'firebase/database';

const CreateStudio = ({active,next,createAccountData,updateAccountData}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [studioName, setStudioName] = useState(createAccountData.studioName);
  const [studioDomain, setStudioDomain] = useState('');

  const handleStudioNameChange = (e) => {
    const name = e.target.value;
    setStudioName(name);
    setStudioDomain(name.toLowerCase().replace(/\s+/g, ''));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateAccountData({studioName,studioDomain})
    next()
    // Handle studio creation logic here
    console.log('Studio Name:', studioName);
    console.log('Studio Domain:', studioDomain);
  };

  if (!active) {
    return null;
  }

  return (

    <div className={`screen create-studio `}>
      <h2 className='screen-title'>Create Your Studio</h2>
      <p className='section-intro'>Let's start with a name for your Studio </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            id="studioName"
            value={studioName}
            placeholder='Enter your Studio name'
            onChange={handleStudioNameChange}
            required
          />
          <p className='studio-domain'  >photoflow.in/<span className={`available`} contentEditable>{studioDomain}</span></p>

        </div>
        <div className="button primary large"
          onClick={handleSubmit}
        >Create Studio</div>
      </form>
    </div>
  );
};

export default CreateStudio;
