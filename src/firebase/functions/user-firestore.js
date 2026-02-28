import { db } from "../app";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch, deleteField, query, where, arrayUnion } from "firebase/firestore";

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

export const migrateUsersToMultiStudio = async () => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    const batch = writeBatch(db);
    let count = 0;

    querySnapshot.docs.forEach((userDoc) => {
        const data = userDoc.data();
        if (data.studio && !data.studios) {
            const oldStudio = data.studio;
            const userRef = doc(db, 'users', userDoc.id);
            
            batch.update(userRef, {
                studios: [oldStudio],
                activeStudioDomain: oldStudio.domain,
                studio: deleteField()
            });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${count} users.`);
    } else {
        console.log('No users needed migration.');
    }
    return count;
};

export const createUser = async (userData) => {
    const {email, studio, displayName, photoURL} = userData;
    const userDocRef = doc(db, 'users', email);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const existingData = userDocSnap.data();
        const updateData = {
            studios: arrayUnion(studio),
            studio: studio,
            activeStudioDomain: studio.domain,
            displayName: displayName || existingData.displayName,
            photoURL: photoURL || existingData.photoURL
        };
        await updateDoc(userDocRef, updateData);
        return { ...existingData, ...updateData };
    }

    const userDoc = {
        displayName: displayName,
        email : email,
        studios : [studio],
        studio : studio,
        photoURL : photoURL,
        hasSeenWelcomeModal: false,
        activeStudioDomain: studio.domain
    }
    await setDoc(userDocRef, userDoc)
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
    const q = query(usersCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return null;
    }
    
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
};
