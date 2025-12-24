import { db } from "../app";
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

// -- Pricing Groups --

/**
 * Fetch all pricing groups from the 'pricings' collection.
 * @returns {Promise<Array>} List of pricing groups.
 */
export const fetchPricingGroups = async () => {
    try {
        const pricingsCollection = collection(db, 'pricings');
        const querySnapshot = await getDocs(pricingsCollection);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching pricing groups:', error.message);
        throw error;
    }
};

/**
 * Create or overwrite a pricing group in the 'pricings' collection.
 * @param {Object} pricingGroupData - The data for the pricing group.
 * @returns {Promise<Object>} The created pricing group data.
 */
export const createPricingGroup = async (pricingGroupData) => {
    try {
        const { id } = pricingGroupData;
        if (!id) throw new Error("Pricing Group ID is required.");
        
        const pricingRef = doc(db, 'pricings', id);
        const dataToSave = {
            ...pricingGroupData,
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...pricingGroupData.metadata
            }
        };

        await setDoc(pricingRef, dataToSave);
        return dataToSave;
    } catch (error) {
        console.error('Error creating pricing group:', error.message);
        throw error;
    }
};

/**
 * Update an existing pricing group in the 'pricings' collection.
 * @param {string} id - The ID of the pricing group to update.
 * @param {Object} updates - The partial data to update.
 * @returns {Promise<Object>} The updated fields.
 */
export const updatePricingGroup = async (id, updates) => {
    try {
        if (!id) throw new Error("Pricing Group ID is required.");

        const pricingRef = doc(db, 'pricings', id);
        const dataToUpdate = {
            ...updates,
            'metadata.updatedAt': new Date().toISOString()
        };

        await updateDoc(pricingRef, dataToUpdate);
        return { id, ...updates };
    } catch (error) {
        console.error('Error updating pricing group:', error.message);
        throw error;
    }
};

/**
 * Delete a pricing group from the 'pricings' collection.
 * @param {string} id - The ID of the pricing group to delete.
 * @returns {Promise<string>} The ID of the deleted pricing group.
 */
export const deletePricingGroup = async (id) => {
    try {
        if (!id) throw new Error("Pricing Group ID is required.");

        const pricingRef = doc(db, 'pricings', id);
        await deleteDoc(pricingRef);
        return id;
    } catch (error) {
        console.error('Error deleting pricing group:', error.message);
        throw error;
    }
};
