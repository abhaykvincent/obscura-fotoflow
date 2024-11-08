// pinUtils.js
export const PIN_STORAGE_KEY = 'gallery_pin';
export const PIN_EXPIRY_KEY = 'pin_expiry';
export const PIN_LENGTH = 4;

// Check if the stored PIN is still valid
export const isPinValid = () => {
  const storedExpiry = localStorage.getItem(PIN_EXPIRY_KEY);
  return storedExpiry && new Date().getTime() < parseInt(storedExpiry, 10);
};

// Save the valid PIN to localStorage with 24-hour expiration
export const savePinToLocalStorage = (enteredPin) => {
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
  localStorage.setItem(PIN_STORAGE_KEY, enteredPin);
  localStorage.setItem(PIN_EXPIRY_KEY, expiryTime.toString());
};
