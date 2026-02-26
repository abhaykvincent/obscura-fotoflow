import { db } from "../app";
import { doc, collection, getDoc, updateDoc } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";
import { removeUndefinedFields } from "../../utils/generalUtils";

// Invitation
export const updateInvitationInFirebase = async (domain, projectId, invitationData) => {
    if (!domain || !projectId || !invitationData) {
        throw new Error('Domain, Project ID, and Invitation data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cUpdating invitation for Project ${projectId} under ${domain}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const existingInvitation = projectData.invitation;

        // Clean up invitationData to remove any undefined fields
        const cleanedInvitationData = removeUndefinedFields(invitationData);

        const updatedInvitation = existingInvitation
            ? { ...existingInvitation, ...cleanedInvitationData }
            : { id: `invitation-${generateRandomString(5)}`, ...cleanedInvitationData };

        await updateDoc(projectDocRef, { invitation: updatedInvitation });

        color = '#54a134';
        console.log(`%cInvitation updated for Project ${projectId} under ${domain} successfully.`, `color: ${color};`);

        return updatedInvitation.id;
    } catch (error) {
        color = 'red';
        console.error(`%cError updating invitation for Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
export const fetchInvitationFromFirebase = async (domain, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required.');
    }

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    const projectSnapshot = await getDoc(projectDocRef);
    
    if (!projectSnapshot.exists()) {
        throw new Error('Project does not exist.');
    }

    const projectData = projectSnapshot.data();
    return {invitation:projectData.invitation,projectId} || null; // Return invitation data or null if not exists
};
