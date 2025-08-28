import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { selectDomain } from '../../app/slices/authSlice';
import { useLocation } from 'react-router';
import { copyToClipboard, extractDomain, getGalleryURL } from '../../utils/urlUtils';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { showAlert } from '../../app/slices/alertSlice';
import { updateSelectionGalleryStatus, updateCollectionStatus } from '../../app/slices/projectsSlice';
import QRCodeModal from './QRCodeModal';
import { QRCodeCanvas } from 'qrcode.react';
import logo from '../../assets/img/logo192.png';

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
  const [qrCodeUrl, setQrCodeUrl] = useState('');


  const onClose = () => dispatch(closeModalWithAnimation('shareGallery'))

  const modalRef = useModalFocus(visible.shareGallery);

  useEffect(()=>{
    console.log(project)
  },[project])

  const handleOpenQRCodeModal = (url) => {
    setQrCodeUrl(url);
    dispatch(openModal('qrCode'));
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas');
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'qr-code.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };


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
          <div className="modal-title">Share Gallery</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">
            {/* map project collections and render it with a check box to select galleries to share */}
            <div className="share-project-details">
              <div className="project-cover">
                <img src={project?.projectCover || '/images/default-cover.jpg'} alt="Project Cover" />
              </div>
              <div className="gallery-details">
                <div className="gallery-details-project">
                 <h4 className="project-name">{project?.name}</h4>
                  <div className="project-type">{project?.type}</div>

                </div>
                <div className="link-pin">
                  <div className='link' >

                    <div className="link-container">
                      <a className='linkToGallery' href={getGalleryURL('share',domain,project?.id)} target='_blank' > ...{getGalleryURL('share',domain,project?.id).slice(-18)}

                      </a>
                    </div>
                  </div>
                    <div className="button primary outline text-only  icon copy"></div>

                </div>
              </div>
              <div className="qr-code-preview" onClick={() => handleOpenQRCodeModal(getGalleryURL('share', domain, project?.id))}>
                  <div className="qr-code-container">
                    <QRCodeCanvas value={getGalleryURL('share', domain, project?.id)} size={80} imageSettings={{
                      src: logo,
                      excavate: true,
                      height: 20,
                      width: 20
                    }} />
                  </div>
                </div>
            </div>

              <div className="select-galleries">
                {project?.collections.map((collection, index) => (
                  <div key={index} className={`gallery-item ${collection.status !== 'visible' ? 'disabled' : ''}`}>
                    <div className="gallery-info" onClick={() => {
                        const newStatus = collection.status === 'visible' ? 'hide' : 'visible';
                        dispatch(updateCollectionStatus({
                          domain,
                          projectId: project?.id,
                          collectionId: collection.id,
                          status: newStatus
                        }));
                      }}>
                      <div className={`status-dot ${collection.status === 'visible' ? 'active' : ''}`}></div>
                      <div>
                        <div className="gallery-name">{collection.name}</div>
                        <div className="gallery-images-count">
                          {collection.filesCount > 1 ? `${collection.filesCount} Photos` : ''}
                        </div>
                      </div>
                    </div>
                    <FormControlLabel
                      control={
                        <IOSSwitch
                          sx={{ m: 1 }}
                          checked={collection.selectionGallery === true}
                          disabled={collection.status !== 'visible'}
                          onChange={(event) => {
                            const newStatus = event.target.checked ? true: false;
                            dispatch(updateSelectionGalleryStatus({
                              domain,
                              projectId: project?.id,
                              collectionId: collection.id,
                              status: newStatus
                            }));
                          }}
                          color="blue"
                        />
                      }
                      label=""
                    />
                  </div>
                ))}
              </div>

              

              <div className="gallery-view-status">

                <div className="link-group">
                  <div className="button primary outline text-only  icon link"
                    onClick={() => {
                      // open link in new tab
                      window.open(getGalleryURL('smart-gallery', domain, project?.id), '_blank');
                    }}
                  >Smart Gallery</div>
                  </div>
                </div>
              <div className="gallery-view-status">
                <div className="link-group">
                  <div className="button primary outline text-only  icon link"
                    onClick={() => {
                      // open link in new tab
                      window.open(getGalleryURL('share', domain, project?.id), '_blank');
                    }}
                  >Gallery Link</div>
                  <div className="button primary outline text-only  icon copy"
                    onClick={() => {
                      copyToClipboard(getGalleryURL('share', domain, project?.id));
                      dispatch(showAlert({ type: 'success', message: 'Gallery link copied to clipboard!' }));
                    }}
                  ></div>
                </div>
                
                <p className="client-label">Anyone with link</p>
                <div className="button secondary  transparent-button icon public">Public</div>
              
                <div className="button primary outline  ">Share</div>

              </div>
              <div className="gallery-view-status">

                <div className="link-group">
                  <div className="button primary outline text-only  icon link"
                    onClick={() => {
                      // open link in new tab
                      window.open(getGalleryURL('selection', domain, project?.id), '_blank');
                    }
                  }
                  >Selection Link</div>
                <div className="button primary outline text-only  icon copy"
                  onClick={() => {
                    copyToClipboard(getGalleryURL('selection', domain, project?.id));
                    dispatch(showAlert({ type: 'success', message: 'Selection link copied to clipboard!' }));
                  }}
                ></div>
                </div>

                <p className="client-label">Client Only</p>
                <div className="button secondary outline icon pin">{project?.pin}</div>
                <div className="button primary outline ">Share</div>

                
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
          >Done</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
      {visible.qrCode && <QRCodeModal url={qrCodeUrl} project={project} />}
    </div>
  );
}

export default ShareGallery