
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, selectModal } from '../../app/slices/modalSlice';
import { useModalFocus } from '../../hooks/modalInputFocus';
import './QRCodeModal.scss';

function QRCodeModal({ url }) {
  const dispatch = useDispatch();
  const visible = useSelector(selectModal);

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
          <div className="qr-code-container">
            <QRCodeCanvas id="qr-code-canvas" value={url} size={256} />
          </div>
          <p className="qr-code-label">Scan the code to view the gallery</p>
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
