// Function to generate a random string
export function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
export function generateMemorablePIN(limit) {
  // Step 1: Generate two random digits
  const randomDigits = Array.from({ length: 2 }, () => Math.floor(Math.random() * 10));

  // Step 2: Memorable pattern
  const thirdDigit = randomDigits[Math.floor(Math.random() * randomDigits.length)] * 2;
  const fourthDigit = (thirdDigit + 1) % 10;

  // Step 3: Combine
  const pin = [...randomDigits, thirdDigit, fourthDigit];

  // Shuffle the PIN to add more randomness
  for (let i = pin.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pin[i], pin[j]] = [pin[j], pin[i]];
  }

  // Convert array to string
  let  pinStr = pin.join('');
  // Truncate the PIN if its length exceeds the limit
  if (limit && pinStr.length > limit) {
    pinStr = pinStr.slice(0, limit);
  }

  return pinStr
}

export function shortenFileName(fileName){
  return fileName?.length > 30
      ? `${fileName.substring(0, 10)}...${fileName.substring(fileName.length - 10)}`
      : fileName
}

export const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export const toTitleCase = (input) =>{
  // Trim any leading/trailing whitespace and split the string into words
  return input
    .trim() // Remove extra spaces from the beginning and end
    .toLowerCase() // Convert the whole string to lowercase
    .split(/\s+/) // Split the string by any whitespace (handles multiple spaces)
    .filter(word => word) // Remove empty strings caused by extra spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(' '); // Join the words back into a single string
}

// Test 
export function convertMegabytes(megabytes, decimalPlaces = 0) {
  const sizes = ['MB', 'GB', 'TB'];

  let sizeIndex = 0;

  if (megabytes > 500 && sizes[sizeIndex] === 'MB') {
    megabytes /= 1000;
    sizeIndex++;
  }

  if (megabytes > 500 && sizes[sizeIndex] === 'GB') {
    megabytes /= 1000;
    sizeIndex++;
  }

  return `${megabytes.toFixed(decimalPlaces)} ${sizes[sizeIndex]}`;
}
// display amount 999999 in indian standerds ₹9,99,999 with ₹ at begining
export function formatDecimal(amount) {
  return '₹'+amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// now for mat it with K suffix like ₹999.9K for ₹9,99,999 
export function formatDecimalK(amount) {
  return '₹'+(amount/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'K';
}

// desired url http://localhost:3000/share/ethan-ross-Ksi9g/birthday-CLhMa
// if localhost localhost:port , if production obscura.fotoflow
// ethan-ross-Ksi9g id projectId and birthday-CLhMa is the collectionId

export const hexToRgb = (hex) => {
  // Remove the leading '#' if present
  hex = hex.replace(/^#/, '');
  
  // Parse r, g, b values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return `${r}, ${g}, ${b}`; // Return as a string
};