import { db } from "../app";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";

// Users
export const fetchUserOrLeadById = async (userId) => {
    // Try fetching from 'users' collection first
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return { id: userDocSnap.id, ...userDocSnap.data() };
    }

    // If not found in 'users', try fetching from 'leads' collection
    const leadDocRef = doc(db, 'leads', userId);
    const leadDocSnap = await getDoc(leadDocRef);

    if (leadDocSnap.exists()) {
        return { id: leadDocSnap.id, ...leadDocSnap.data() };
    }

    return null; // Not found in either collection
};

export const createUser = async (userData) => {
    const {email,studio,displayName,photoURL} = userData;
    console.log(displayName)
    const usersCollection = collection(db, 'users');
    const userDoc = {
        displayName: displayName,
        email : email,
        studio : studio,
        photoURL : photoURL,
        hasSeenWelcomeModal: false
    }
    await setDoc(doc(usersCollection, userDoc.email), userDoc)
    return userDoc
}
export const updateUser = async (email, updateData) => {
    const usersCollection = collection(db, 'users');
    const userDocRef = doc(usersCollection, email);
    await updateDoc(userDocRef, updateData);
    return true;
};
export const fetchUsers = async () => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return usersData;
};
export const fetchLeads = async () => {
    const leadsCollection = collection(db, 'leads');
    const querySnapshot = await getDocs(leadsCollection);
    const leadsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return leadsData;
};
export const fetchUserByEmail = async (email) => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const user = usersData.find((user) => user.email === email);
    return user;
};
