import React, { useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

const ClientsSize = ({active,next,createAccountData,updateAccountData}) => {

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [clientsPerMonth, setClientsPerMonth] = useState('');
  const [projectSize, setProjectSize] = useState('');

  const handleSubmit = (e) => {
    next()
    e.preventDefault();
    updateAccountData({clientsPerMonth,projectSize})
  };

  if (!active) {
    return null;
  }
  return (

    <div className="screen client-size">
      
      <h2 className='screen-title'>Clients per Month</h2>
      <form onSubmit={next}>
        <p className='section-intro'>Approximatily,in a month, how many clients do you manage </p>
        <div className="form-group">
          <div className="grid three">
            <div className="option"
              onClick={
                () => {
                  setClientsPerMonth('2');
                }
              }
            >
              <p>2 </p>
            </div>
            <div className="option"
              onClick={() => setClientsPerMonth('4')}
            >
              <p>4 </p>
            </div>
            <div className="option"
              onClick={() => setClientsPerMonth('8')}
            >
              <p>8</p>
            </div>
          </div>
        </div>
      <p className='section-intro'>How much storage you need to send a gallery to the client per project?</p>
        <div className="form-group">
          <div className="grid three">
            <div className="option"
            
            onClick={() => setProjectSize('4')}>
              <p>4 GB</p>              
              <p className='description'>800 Photos x 5MB</p>

            </div>
            <div className="option"
              onClick={() => setProjectSize('8')}
            >
              <p>5 GB</p>
              <p className='description'>1600 Photos x 5MB</p>
            </div>
            <div className="option"
              onClick={() => setProjectSize('16')}
            >
              <p>16 GB</p>
              <p className='description'>3200 Photos x 5MB</p>
            </div>
            <div className="option"
              onClick={() => setProjectSize('32')}
            >
              <p>32 GB</p>
              <p className='description'>6400 Photos x 5MB</p>
            </div>
          </div>
        </div>
        <div className="button tertiary large" onClick={next} >Skip</div>
        <div className="button primary large" onClick={handleSubmit}>Next</div>
      </form>
    </div>
  );
};

export default ClientsSize;
