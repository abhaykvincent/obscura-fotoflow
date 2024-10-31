import React, { useState, createRef, useEffect } from 'react';
import { MdLockOutline } from 'react-icons/md';
import './GalleryPIN.scss';

const PIN_STORAGE_KEY = 'gallery_pin';
const PIN_EXPIRY_KEY = 'pin_expiry';

// Helper to check if the stored PIN is still valid
const isPinValid = () => {
  const storedExpiry = localStorage.getItem(PIN_EXPIRY_KEY);
  return storedExpiry && new Date().getTime() < parseInt(storedExpiry, 10);
};

function GalleryPIN({ setAuthenticated, projectPin }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const pinInputs = pin.map(() => createRef());

  useEffect(() => {
    // Check if there is a valid PIN stored in localStorage
    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (storedPin && isPinValid()) {
      setAuthenticated(true); // Automatically authenticate if the PIN is valid
    } else {
      pinInputs[0].current.focus(); // Otherwise, focus on the first input
    }
  }, [setAuthenticated, pinInputs]);

  const handlePinCheck = (enteredPin) => {
    if (enteredPin === projectPin) {
      setAuthenticated(true);
      savePinToLocalStorage(enteredPin); // Save the valid PIN to localStorage
    } else {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
        setPin(['', '', '', '']);
        pinInputs[0]?.current?.focus();
      }, 500);
    }
  };

  const savePinToLocalStorage = (enteredPin) => {
    const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours from now
    localStorage.setItem(PIN_STORAGE_KEY, enteredPin);
    localStorage.setItem(PIN_EXPIRY_KEY, expiryTime.toString());
  };

  const handlePinChange = (index, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    const newPin = [...pin];
    newPin[index] = sanitizedValue.slice(0, 1); // Take only the first digit
    setPin(newPin);

    if (index < 3 && sanitizedValue !== '') {
      pinInputs[index + 1].current.focus();
    } else if (sanitizedValue !== '') {
      const enteredPin = newPin.join('');
      if (enteredPin.length === 4) handlePinCheck(enteredPin);
    }

    // Handle backspace or empty input
    if (sanitizedValue === '' && index > 0) {
      pinInputs[index - 1].current.focus();
    }
  };

  return (
    <div className="gallery-pin-container">
      <MdLockOutline className="lock-icon" />
      <p>Enter your PIN</p>
      <div className="pin-inputs-container">
        {pinInputs.map((inputRef, index) => (
          <input
            className={`pin-input ${pinError ? 'error' : ''}`}
            key={index}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={pin[index]}
            onChange={(e) => handlePinChange(index, e.target.value)}
            onFocus={() => inputRef.current.select()}
            ref={inputRef}
          />
        ))}
      </div>
      <button
        className="button primary"
        onClick={() => handlePinCheck(pin.join(''))}
      >
        Submit
      </button>
    </div>
  );
}

export default GalleryPIN;
