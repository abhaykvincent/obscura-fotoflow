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
export const toKebabCase = (str)=> {
  return str.toLowerCase().replace(/\s+/g, '-');
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

  return `${megabytes?.toFixed(decimalPlaces)} ${sizes[sizeIndex]}`;
}

export const convertUsdToInr = (usdCost, exchangeRate = 83.50) => {
  if (typeof usdCost !== 'number' || usdCost < 0) {
    throw new Error('USD cost must be a non-negative number');
  }
  if (typeof exchangeRate !== 'number' || exchangeRate <= 0) {
    throw new Error('Exchange rate must be a positive number');
  }
  return Number((usdCost * exchangeRate).toFixed(2));
};
export function formatStorage(size, unit) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const unitIndex = units.indexOf(unit.toUpperCase());
  if (unitIndex === -1) {
      throw new Error("Invalid unit provided");
  }

  let sizeInBytes = size * Math.pow(1024, unitIndex);

  let formattedSize = sizeInBytes;
  let formattedUnit = "B";

  for (let i = 0; i < units.length; i++) {
      if (sizeInBytes < 1024 || i === units.length - 1) {
          formattedSize = sizeInBytes.toFixed(2);
          formattedUnit = units[i];
          break;
      }
      sizeInBytes /= 1024;
  }

  // Remove unnecessary decimal places for whole numbers
  formattedSize = parseFloat(formattedSize);
  return `${formattedSize} ${formattedUnit}`;
}

// display amount 999999 in indian standerds ₹9,99,999 with ₹ at begining
export function formatDecimal(amount) {
  return '₹'+amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// now for mat it with K suffix like ₹999.9K for ₹9,99,999 
export function formatDecimalK(amount) {
  return '₹'+(amount/1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'K';
}
export function formatDecimalKnos(amount) {
  return ((amount/1000).toFixed(2)).toString().replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",") + 'K';
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

export const  greetUser=(userName) => {
  if (!userName) {
    console.error("User name is required!");
    return "Hello! What's your name?";
  }

  const now = new Date();
  const hours = now.getHours();
  let timeOfDay;
  let personalizedMessage;
  if (hours < 5) { // night Owls
    timeOfDay = "Happy late night!";
    personalizedMessage = "Even the stars are ready for their close-up—are you ";
  } else if (hours < 6) { // Early Birds
    timeOfDay = "Hei Early Bird!";
    personalizedMessage = "Fresh mornings, fresh perspectives. Ready to capture today?";
  } else if (hours < 8.5) { // Golden Hour
    timeOfDay = "Happy Golden Hour!";
    personalizedMessage = " Let the golden hour inspire your creativity today.";
  } else if (hours < 12) {
    timeOfDay = "Fresh morning!";
    personalizedMessage = "Sunrise calls for creativity. Let's get started!";
  } else if (hours < 16.5) {
    timeOfDay = "Good afternoon!";
    personalizedMessage = "Afternoon vibes are perfect for creating something extraordinary!";
  } else if (hours < 18.5) {// Golden Hour
    timeOfDay = "Happy Golden Hour!";
    personalizedMessage = " Let the golden hour inspire your creativity today.";
  } else if (hours < 23) { // 
    timeOfDay = "Happy late night!";
    personalizedMessage = "Even the stars are ready for their close-up—are you ";
  } else {// Final hour of the day
    timeOfDay = "Happy late night!";
    personalizedMessage = "When the world sleeps, creativity awakens. Let's make magic! ";
  }
  return      {
    timeOfDay,
    personalizedMessage,
    userName,
  }
}

export const calculateDelay = (text) => {
  const baseDelay = 100; // Minimum delay in milliseconds
  const delayPerChar = 1; // Additional delay per character
  return Math.min(baseDelay + text.length * delayPerChar, 2000); // Cap at 2 seconds
};
