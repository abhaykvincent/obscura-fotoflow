
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/app';

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

export const findMatchingUsersOrLeads = async (email, phone) => {
  const matchingUsers = [];
  const matchingLeads = [];

  const usersRef = collection(db, 'users');
  const leadsRef = collection(db, 'leads');

  // Search for users by email or phone
  const userEmailQuery = query(usersRef, where('email', '==', email));
  const userPhoneQuery = query(usersRef, where('phone', '==', phone));

  const [userEmailSnapshot, userPhoneSnapshot] = await Promise.all([
    getDocs(userEmailQuery),
    getDocs(userPhoneQuery),
  ]);

  userEmailSnapshot.forEach((doc) => {
    matchingUsers.push({ id: doc.id, ...doc.data() });
  });

  userPhoneSnapshot.forEach((doc) => {
    const user = { id: doc.id, ...doc.data() };
    if (!matchingUsers.find((u) => u.id === user.id)) {
      matchingUsers.push(user);
    }
  });

  // Search for leads by email or phone
  const leadEmailQuery = query(leadsRef, where('email', '==', email));
  const leadPhoneQuery = query(leadsRef, where('phone', '==', phone));

  const [leadEmailSnapshot, leadPhoneSnapshot] = await Promise.all([
    getDocs(leadEmailQuery),
    getDocs(leadPhoneQuery),
  ]);

  leadEmailSnapshot.forEach((doc) => {
    matchingLeads.push({ id: doc.id, ...doc.data() });
  });

  leadPhoneSnapshot.forEach((doc) => {
    const lead = { id: doc.id, ...doc.data() };
    if (!matchingLeads.find((l) => l.id === lead.id)) {
      matchingLeads.push(lead);
    }
  });
  console.log({ matchingUsers, matchingLeads })
  return { matchingUsers, matchingLeads };
};
