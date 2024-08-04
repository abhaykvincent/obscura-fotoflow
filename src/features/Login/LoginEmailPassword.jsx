import React, { useState } from 'react';
import { provider,auth,signInWithPopup } from '../../firebase/app';
import {GoogleAuthProvider} from 'firebase/auth';
import { Navigate, useNavigate } from 'react-router';
import { fullAccess, getOwnerFromTeams } from '../../data/teams';
import { useDispatch, useSelector } from 'react-redux';
import { login, loginEmailPassword } from '../../app/slices/authSlice';
import { closeModal, openModal, selectModal } from '../../app/slices/modalSlice';

const LoginEmailPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, setLogin] = useState({
    userId: '',
    password: '',
  });
  const visible = useSelector(selectModal)
  const onClose = () => dispatch(closeModal('loginEmailPassword'))
  document.title = `Login`
  if (!visible.loginEmailPassword) {
    return null;
  }
  const handleInputChange = (event) => {
    const {name,value} = event.target;
    setLogin((prevData) => ({
        ...prevData,
        [name]: value,
    }));
    
};
  return (
    <>
    <div className="modal loginModal emailPassword">
      <div className="modal-header">
        <div className="modal-controls">
        <div className="control close" onClick={onClose}></div>
        </div>
        Login
      </div>
      <div className="modal-body">
        <div className="form-section">
          <div className="field">
              <label className="" htmlFor="">Username</label>
              <input className="" name="userId" value={login.userId} type="text"
                  onChange={handleInputChange} />
          </div>
          <div className="field">
              <label className="" htmlFor="">Password</label>
              <input className="" type="password" name="password" value={login.password} 
                  onChange={handleInputChange} />
          </div>
      </div>
        <div className="actions">
          <div className='button' onClick={()=>{dispatch(loginEmailPassword({...login}))}} >Login<div className="lock"></div></div>
        </div>
      </div>
      <div className="logo">
        
      </div>
    </div>
    <div className="modal-backdrop" onClick={onClose}></div>
    </>
  );
}

export default LoginEmailPassword;
// Line Complexity  0.6 ->
