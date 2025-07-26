import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { selectDomain } from '../../app/slices/authSlice';
import { useLocation } from 'react-router';
import { copyToClipboard, extractDomain, getGalleryURL } from '../../utils/urlUtils';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { showAlert } from '../../app/slices/alertSlice';
import { updateCollectionStatus, updateCollectionStatusThunk } from '../../app/slices/projectsSlice';

import './ShareGallery.scss'

// Corrected IOSSwitch definition
const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme, ...props }) => ({ // Destructure props here
  width: 32,
  height: 16,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        // Now 'props.color' is accessible
        backgroundColor: props.color === 'green' ? '#428924' : '#0c84ff',
        opacity: 1,
        border: 0,
        ...theme.applyStyles('dark', {
          backgroundColor: '#2ECA45',
        }),
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
      ...theme.applyStyles('dark', {
        color: theme.palette.grey[600],
      }),
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
      ...theme.applyStyles('dark', {
        opacity: 0.3,
      }),
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 12,
    height: 12,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#E9E9EA22',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
    ...theme.applyStyles('dark', {
      backgroundColor: '#39393D',
    }),
  },
}));

function ShareGallery({project }) {
  // Get the current location object
  const location = useLocation();
  const dispatch = useDispatch()
  const currentUrl = window.location.href;

  const visible = useSelector(selectModal)
  const domain = useSelector(selectDomain)

  const onClose = () => dispatch(closeModalWithAnimation('shareGallery'))

  const modalRef = useModalFocus(visible.shareGallery);

  useEffect(()=>{
    console.log(project)
  },[project])
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
          <div className="modal-title">Share Galleries</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            {/* map project collections and render it with a check box to select galleries to share */}
          <h4>{project?.name}</h4>

              <div className="select-galleries">

              <div className="galleries-share-list-selection">

                {project?.collections.map((collection, index) => (
                  <>
                    {/* Gallery choose */}
                    <div key={index} className='gallery-field'>
                      <div className="form-item">
                        <div className="input gallery-status">
                        <FormControlLabel
                          control={
                            <IOSSwitch
                              sx={{ m: 1 }}
                              checked={collection.status === 'visible'} // Set checked based on collection status
                              onChange={(event) => {
                                const newStatus = event.target.checked ? 'visible' : 'hide';
                                dispatch(updateCollectionStatus({
                                  domain,
                                  projectId: project?.id,
                                  collectionIndex: index,
                                  status: newStatus
                                }));
                              }}
                              color="green"
                            />
                          }
                          label={
                            <>
                              <div className='gallery-name'>{collection.name}</div>
                              <div className="gallery-images-count">
                                {collection.filesCount > 1 ? `${collection.filesCount}` : ''}
                              </div>
                            </>
                          }
                        />
                        </div>
                        <div className="label">
                          <label></label>
                        </div>
                      </div>

                      <div className="input selection-status">
                        <FormControlLabel
                          control={<IOSSwitch sx={{ m: 1 }} defaultChecked color="blue" />} // Pass color to IOSSwitch
                        />
                      </div>
                    </div>
                  </>
                ))}

              </div>


              </div>


              <p className="client-label">Gallery link</p>
              <div className="link-pin">
                <div className='link' >

                    <div className="link-container">
                    <a className='linkToGallery' href={getGalleryURL('share',domain,project?.id)} target='_blank' >.../{domain}{getGalleryURL('share',domain,project?.id).split(domain)[1]}
                      <div className="button icon icon-only open-in-new"></div>
                    </a>

                  </div>

              </div>
              <p className="copy-link button icon copy pin" onClick={() => {
                  copyToClipboard(getGalleryURL('share',domain,project.id))
                  dispatch(showAlert({
                    message: 'Link copied to clipboard',
                    type: 'success'
                  }))
                  setTimeout(() => {
                    // open link in new windowcgetGalleryURL('share',domain,project.id)
                    window.open(getGalleryURL('share',domain,project.id), '_blank')
                  }, 2000)
                }
                }> Link</p>
                <p className="copy-link button icon  pin" onClick={() => {
                  copyToClipboard(getGalleryURL('share',domain,project.id))
                }
                }>{project?.pin}</p>
            </div>

          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Close</div>

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