// GalleryPIN.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MdLockOutline } from 'react-icons/md';
import { isPinValid, savePinToLocalStorage, PIN_LENGTH } from '../../utils/pinUtils';
import './GalleryPIN.scss';
import { setUserType } from '../../analytics/utils';

function GalleryPIN({ setAuthenticated, projectPin }) {
  const [pin, setPin] = useState(new Array(PIN_LENGTH).fill(''));
  const [pinError, setPinError] = useState(false);
  const pinInputs = useRef([]);

  // Focus first input or authenticate if a valid PIN is in storage
  useEffect(() => {
    if (isPinValid()) {
      setAuthenticated(true);

    } else {
      pinInputs.current[0]?.focus();
    }
  }, [setAuthenticated]);


  const handlePinCheck = (newPin) => {
    const enteredPin = newPin.join('');
    if (enteredPin === projectPin) {
      setAuthenticated(true);
      savePinToLocalStorage(enteredPin);
      setUserType('Client');

    } else {
      setPinError(true);
      setTimeout(() => resetPin(), 500);
    }
  };

  const resetPin = () => {
    setPin(new Array(PIN_LENGTH).fill(''));
    setPinError(false);
    pinInputs.current[0]?.focus();
  };

  const handlePinChange = (index, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 1); // Allow only one digit
    if (!sanitizedValue) return;

    const newPin = [...pin];
    newPin[index] = sanitizedValue;
    setPin(newPin);

    // Move focus or check PIN after entering the last digit
    if (index === PIN_LENGTH - 1) {
      handlePinCheck(newPin);
    } else {
      pinInputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index) => {
    if (pin[index] === '') {
      if (index > 0) pinInputs.current[index - 1]?.focus();
    } else {
      const newPin = [...pin];
      newPin[index] = '';
      setPin(newPin);
    }
  };

  return (
    <div className="gallery-pin-container">
      <MdLockOutline className="lock-icon" />
      <p>Enter your PIN</p>
      <div className="pin-inputs-container">
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <input
            key={index}
            ref={(el) => (pinInputs.current[index] = el)}
            className={`pin-input ${pinError ? 'error' : ''}`}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={pin[index]}
            onChange={(e) => handlePinChange(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') handleBackspace(index);
            }}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
      <button className="button primary" onClick={() => handlePinCheck()}>
        Submit
      </button>
    </div>
  );
}

export default GalleryPIN;
