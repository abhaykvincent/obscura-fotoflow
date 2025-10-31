
import { Timestamp } from 'firebase/firestore';

export const convertTimestamps = (data) => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item));
  }

  const newData = {};
  for (const key in data) {
    newData[key] = convertTimestamps(data[key]);
  }
  return newData;
};
