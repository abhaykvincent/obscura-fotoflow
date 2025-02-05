import { db } from '../../firebase/app';
import { 
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';

// Notification structure template
const notificationTemplate = {
  title: '',
  message: '',
  type: 'system', // system|team|project|billing
  isRead: false,
  actionLink: '',
  senderId: '',
  priority: 'normal', // low|normal|high|critical
  expiresAt: null,
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: '', // user ID
    updatedBy: ''  // user ID
  }
};

export const fetchNotificationsFromFirestore = async (studioId) => {
  try {
    const notificationsRef = collection(
      doc(db, 'studios', studioId), 
      'notifications'
    );
    
    const q = query(
      notificationsRef,
      orderBy('metadata.createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
};

export const markNotificationReadInFirestore = async (studioId, notificationId) => {
  try {
    const notificationRef = doc(
      db, 
      'studios', studioId, 
      'notifications', notificationId
    );

    await updateDoc(notificationRef, {
      isRead: true,
      'metadata.updatedAt': new Date().toISOString()
    });
    
    return notificationId;
  } catch (error) {
    throw new Error(`Failed to mark notification read: ${error.message}`);
  }
};

export const deleteNotificationFromFirestore = async (studioId, notificationId) => {
  try {
    const notificationRef = doc(
      db, 
      'studios', studioId, 
      'notifications', notificationId
    );

    await deleteDoc(notificationRef);
    return notificationId;
  } catch (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
};

// Optional: Create notification helper
export const createNotificationInFirestore = async (studioId, notificationData) => {
  try {
    const notificationsRef = collection(
      doc(db, 'studios', studioId), 
      'notifications'
    );

    const newNotification = {
      ...notificationTemplate,
      ...notificationData,
      metadata: {
        ...notificationTemplate.metadata,
        ...notificationData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const docRef = doc(notificationsRef);
    await setDoc(docRef, newNotification);
    
    return { id: docRef.id, ...newNotification };
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};