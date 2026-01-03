// pinUtils.js
export const PIN_LENGTH = 4;

const getPinStorageKey = (projectId) => `gallery_pin_${projectId}`;
const getPinExpiryKey = (projectId) => `pin_expiry_${projectId}`;

// Check if the stored PIN is still valid for a specific project
export const isPinValid = (projectId) => {
  if (!projectId) return false;
  const storedExpiry = localStorage.getItem(getPinExpiryKey(projectId));
  const storedPin = localStorage.getItem(getPinStorageKey(projectId));
  return storedPin && storedExpiry && new Date().getTime() < parseInt(storedExpiry, 10);
};

// Save the valid PIN to localStorage with 24-hour expiration for a specific project
export const savePinToLocalStorage = (enteredPin, projectId) => {
  if (!projectId) return;
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
  localStorage.setItem(getPinStorageKey(projectId), enteredPin);
  localStorage.setItem(getPinExpiryKey(projectId), expiryTime.toString());
};