import React, { useEffect, useState } from 'react';
import './ShareGallery.scss'
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { selectDomain } from '../../app/slices/authSlice';
import { useLocation } from 'react-router';
import { copyToClipboard, extractDomain, getGalleryURL } from '../../utils/urlUtils';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { showAlert } from '../../app/slices/alertSlice';

function ShareGallery({project }) {
  // Get the current location object
  const location = useLocation();

  // Extract the full current URL
  const currentUrl = window.location.href;
  const dispatch = useDispatch()
  const visible = useSelector(selectModal)
  const onClose = () => dispatch(closeModalWithAnimation('shareGallery'))
  const domain = useSelector(selectDomain)

const modalRef = useModalFocus(visible.shareGallery);
  if (!visible.shareGallery) {
    return null;
  }
  else{
  }

  return (
    <div className="share-gallery modal-container ">
      <div className="modal create-project island">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Share  Galleries</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            {/* map project collections and render it with a check box to select galleries to share */}
          <h4>{project.name}</h4>
            
              <div className="select-galleries">
                
              <p className='client-label'>Select galleries</p>
              <div className="galleries-share-list-selection">
                {project.collections.map((collection, index) => (
                  <div className="form-item" key={index}>
                    <div className="input">
                      <input type="checkbox" checked={true} />
                    </div>
                    <div className="label">
                      <label>{collection.name}</label>
                    </div>
                  </div>
                ))}
              </div>

                
              </div>
              

              <div className="link-pin">
                <div className='link' >
                  <a className="" href={getGalleryURL('share',domain,project.id)} target='_blank'><div className="link-container">
                <a className='linkToGallery' href={getGalleryURL('share',domain,project.id)} target='_blank' >.../{domain}{getGalleryURL('share',domain,project.id).split(domain)[1]}</a>
                <div className="button icon icon-only open-in-new"></div>
              </div></a>
                  
                </div>
                <p className="copy-link button icon copy pin" onClick={() => {
                    copyToClipboard(getGalleryURL('share',domain,project.id))
                    
                  }
                  }>Copy</p>
                <p className='pin'>🔐 {project.pin}</p>
              </div>
              
              {/* <div className="client-notification">
              <p className='client-label'>Sent link to Whatsapp</p>
                  <div className="form-item">
                  <div className="input">
                    <input type="checkbox" checked={true}/>
                  </div>
                    <div className="label">
                      <label>{project.name}</label>
                      <p>+91 {project.phone}</p>
                    </div>
                  </div>
              </div> */}

          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Cancel</div>
          
          {/* <div className="button primary outline"
            onClick={()=>{
              // go to https://wa.me/[phone number]?text=[pre-filled message]
              window.open(`https://wa.me/?text=Hey, I have a project that I'd like to share with you. Check it out at ${getGalleryURL('share',domain,project.id)}/`,'_blank');
            }}
          >Share</div>
          <div className="button primary "
          onClick={()=>{
            window.open(`https://wa.me/?text=Hey, I have a Gallery for Selection that I'd like to share with you. Check it out at ${getGalleryURL('selection',domain,project.id)}/`,'_blank');
          }}
          >Selection</div> */}
          <div className="button primary " /* Photos */
          onClick={()=>{
            // go to https://wa.me/[phone number]?text=[pre-filled message]
            window.open(`https://wa.me/?text=Hey, I have a project that I'd like to share with you. Check it out at ${getGalleryURL('share',domain,project.id)}/`,'_blank');
          }}
          >Share</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default ShareGallery