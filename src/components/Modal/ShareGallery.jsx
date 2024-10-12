import React, { useEffect, useState } from 'react';
import './ShareGallery.scss'
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, selectModal } from '../../app/slices/modalSlice';
import { selectDomain } from '../../app/slices/authSlice';
import { useLocation } from 'react-router';
import { extractDomain, getGalleryURL } from '../../utils/urlUtils';

function ShareGallery({project }) {
  // Get the current location object
  const location = useLocation();

  // Extract the full current URL
  const currentUrl = window.location.href;
  const dispatch = useDispatch()
  const visible = useSelector(selectModal)
  const onClose = () => dispatch(closeModal('shareGallery'))
  const domain = useSelector(selectDomain)
  if (!visible.shareGallery) {
    return null;
  }
  else{
  }

  return (
    <div className="share-gallery modal-container">
      <div className="modal create-project">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Share {project.name} Galleries</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            {/* map project collections and render it with a check box to select galleries to share */}
            
              <div className="select-galleries">
                
              <p className='client-label'>Select galleries</p>
                {project.collections.map((collection) => {
                return (
                  <div className="form-item">
                  <div className="input">
                    <input type="checkbox" checked/>
                  </div>
                    <div className="label">
                      <label>{collection.name}</label>
                    </div>
                  </div>
                );
              })}
              </div>
              <div className="link-pin">

                <a className='link' href={getGalleryURL('share',domain,project.id)} target='_blank'
                >{`🔗 Share Gallery`}</a>
                <p className='access'>🔓 Public</p>
              </div>
              <div className="link-pin">

              <a className='link' href={getGalleryURL('selection',domain,project.id)} target='_blank'
                >{`🔗 Selection Gallery`}</a>
                <p className='pin'>🔐 {project.pin}</p>
              </div>
              
              <div className="client-notification">
              <p className='client-label'>Sent link to Whatsapp</p>
                  <div className="form-item">
                  <div className="input">
                    <input type="checkbox" checked/>
                  </div>
                    <div className="label">
                      <label>{project.name}</label>
                      <p>+91 {project.phone}</p>
                    </div>
                  </div>
              </div>

          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Cancel</div>
          
          <div className="button primary outline" /* Photos */
            onClick={()=>{
              // go to https://wa.me/[phone number]?text=[pre-filled message]
              window.open(`https://wa.me/?text=Hey, I have a project that I'd like to share with you. Check it out at ${getGalleryURL('share',domain,project.id)}/`,'_blank');
            }}
          >Share</div>
          <div className="button primary " /* Photos */
          onClick={()=>{
            // go to https://wa.me/[phone number]?text=[pre-filled message]
            window.open(`https://wa.me/?text=Hey, I have a Gallery for Selection that I'd like to share with you. Check it out at ${getGalleryURL('selection',domain,project.id)}/`,'_blank');
          }}
          >Selection</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default ShareGallery