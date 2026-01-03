// src/utils/dummyDataUtils.js
import { generateRandomString } from './stringUtils';

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const firstNames = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'James', 'Sophia', 'William', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Theodore', 'Harper'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'];
const domains = ['example.com', 'test.com', 'demo.org', 'photostudio.net', 'creative.co'];
const studioSuffixes = ['Photography', 'Studios', 'Creative', 'Visuals', 'Art', 'Collective'];
const roles = ['photographer', 'editor', 'assistant'];

export const generateDummyUserData = () => {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const displayName = `${firstName} ${lastName}`;
  const studioName = `${firstName}'s ${getRandomElement(studioSuffixes)}`;
  const domain = getRandomElement(domains);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${generateRandomString(3)}@${domain}`;
  const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

  return {
    email,
    phone,
    displayName,
    studioName,
    domain,
    role: getRandomElement(roles),
  };
};