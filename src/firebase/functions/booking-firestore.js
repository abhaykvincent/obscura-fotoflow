import { db } from "../app";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";

/**
 * Adds a new booking for a specific studio to Firestore.
 * @param {string} domain - The studio's subdomain/domain.
 * @param {object} bookingData - The details of the booking.
 * @returns {Promise<object>} The saved booking data.
 */
export const addBookingToFirestore = async (domain, bookingData) => {
  const id = `booking-${generateRandomString(8)}`;
  const newBookingData = {
    id,
    ...bookingData,
    createdAt: new Date().getTime(),
  };

  try {
    const studioDocRef = doc(db, 'studios', domain);
    const bookingsCollectionRef = collection(studioDocRef, 'bookings');
    await setDoc(doc(bookingsCollectionRef, id), newBookingData);
    console.log("Booking added successfully 🎉");
    return newBookingData;
  } catch (error) {
    console.error('Error adding booking:', error.message);
    throw error;
  }
};

/**
 * Fetches all bookings for a specific studio from Firestore.
 * @param {string} domain - The studio's subdomain/domain.
 * @returns {Promise<array>} The list of bookings.
 */
export const fetchBookingsFromFirestore = async (domain) => {
  try {
    const studioDocRef = doc(db, 'studios', domain);
    const bookingsCollectionRef = collection(studioDocRef, 'bookings');
    const querySnapshot = await getDocs(bookingsCollectionRef);
    const bookings = querySnapshot.docs.map(doc => doc.data());
    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    throw error;
  }
};
