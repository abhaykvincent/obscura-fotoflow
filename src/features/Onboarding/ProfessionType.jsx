import React, { useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

const ProfessionType = ({active,next,createAccountData,updateAccountData}) => {

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [professionType, setProfessionType] = useState('Freelancer');
  const [professionDomain, setProfessionDomain] = useState('Photographer');

  const handleSubmit = (e) => {
    next()
    e.preventDefault();
    updateAccountData({professionType,professionDomain})
  };

  if (!active) {
    return null;
  }
  return (

    <div className={`screen profession-type `}>
      
      <h2 className='screen-title'>What type</h2>
      <p className='section-intro'>Are you a Freelance photographer, or Studio manager? </p>
      <form onSubmit={next}>
        <div className="form-group">
          <div className="grid three">
            <div className="option"
              onClick={() => {
                setProfessionType('Hobbyiest');
              }}
            >
              <p>Hobbyiest </p>
            </div>
            <div className="option"
              onClick={() => {
                setProfessionType('Freelancer');
              }}
            >
              <p>Freelancer </p>
            </div>
            <div className="option"
              onClick={() => {
                setProfessionType('Studio manager');
              }}
            >
              <p>Studio manager </p>
            </div>
          </div>
        </div>
      

      <p className='section-intro'>Are you a Photographer or a Videographer</p>
      
        <div className="form-group">
          <div className="grid three">
            <div className="option"
            onClick={() => {
              setProfessionDomain('Photographer');
            }}>
              <p>Photographer </p>
            </div>
            <div className="option"
            onClick={() => {
              setProfessionDomain('Videographer');
            }}>
              <p>Videographer </p>
            </div>
          </div>
        </div>
        <div className="button tertiary large" onClick={next} >Skip</div>
        <div className="button primary large"
        onClick={handleSubmit}
        >Next</div>
      </form>
    </div>
  );
};

export default ProfessionType;
