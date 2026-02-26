import { db } from "../app";
import { doc, getDoc, updateDoc, collection } from "firebase/firestore";

// Teams
export const addCrewToFirestore = async (domain, projectId, eventId, userData) => {
    if (!domain || !projectId || !eventId || !userData) {
        throw new Error('Domain, Project ID, Event ID, and User data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding crew to Event ${eventId} in Project ${projectId} under ${domain}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const event = projectData.events.find(event => event.id === eventId);

        if (!event) {
            throw new Error('Event does not exist.');
        }

        const updatedEvent = {
            ...event,
            crews: [...event.crews, userData]
        };

        const updatedProject = {
            ...projectData,
            events: projectData.events.map(event => event.id === eventId ? updatedEvent : event)
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cCrew added to Event ${eventId} in Project ${projectId} under ${domain} successfully.`, `color: ${color};`);

        return eventId;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding crew to Event ${eventId} in Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
