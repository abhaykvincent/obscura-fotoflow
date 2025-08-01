
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { selectStudio } from '../../app/slices/studioSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
//getGalleryURL
import { getGalleryURL } from '../../utils/urlUtils';
import './QRCodeModal.scss';

import logo from '../../assets/img/logo192.png';

function QRCodeModal({ project, url }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);
  const studio = useSelector(selectStudio);
  const onClose = () => dispatch(closeModalWithAnimation('qrCode'));
  const modalRef = useModalFocus(visible.qrCode);

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

  if (!visible.qrCode) {
    return null;
  }

  return (
    <div className="qr-code-modal modal-container">
      <div className="modal island" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">Scan QR Code</div>
        </div>
        <div className="modal-body">
          <p className="qr-code-label"> 
              <div className="button primary outline text-only  icon qr-code-scan"></div>
            
            Scan to view gallery</p>
          <div className="qr-code-container">
            <QRCodeCanvas id="qr-code-canvas" value={url} size={256} imageSettings={{
              src: logo,
              excavate: true,
              height: 64,
              width: 64
            }} />
          </div>

          <h3 className="qr-code-name">{project?.name}</h3>
          <p className="qr-code-type">{project?.type}</p>

          <div className="link-pin">
            <div className='link' >
            
                <div className="link-container">
                  <a className='linkToGallery' href={getGalleryURL('share',studio?.domain,project?.id)} target='_blank' > 
                    ...{getGalleryURL('share',studio?.domain,project?.id).slice(-40)}
                    <div className="button icon icon-only open-in-new"></div>
                  </a>
                </div>
              </div>
              <div className="button primary outline text-only  icon copy"></div>
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Close</div>
          <div className="button primary" onClick={downloadQRCode}>Download</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default QRCodeModal;
