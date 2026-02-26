import { db } from "../app";
import { doc, collection, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";

// Event
export const addEventToFirestore = async (domain, projectId, eventData) => {
    if (!domain || !projectId || !eventData) {
        throw new Error('Domain, Project ID, and Event data are required.');
    }

    const { type, date, location } = eventData;
    const id = `${type.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding Event ${id} to Project ${projectId} in ${domain ? domain : 'undefined'}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    const eventsCollectionRef = collection(projectDocRef, 'events');
    const eventDoc = {
        id: id,
        ...eventData
    };

    try {
        await setDoc(doc(eventsCollectionRef, eventDoc.id), eventDoc);

        await updateDoc(projectDocRef, {
            events: arrayUnion({ id, type, date, location, crews: [] }) // Assuming events is an array in your projectData
        });

        color = '#54a134';
        console.log(`%cEvent ${id} added to Project ${projectId} in ${domain} successfully.`, `color: ${color};`);
        return id;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding event ${id} to Project ${projectId} in ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};

export const addUploadCompletionEventToFirestore = async (domain, projectId, collectionId, uploadedFiles, importFileSize, collectionName) => {
    if (!domain || !projectId || !collectionId || !uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Domain, Project ID, Collection ID, and uploaded files are required.');
    }

    const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);
        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const existingEvents = projectData.events || [];

        const eventDate = uploadedFiles[0]?.dateTimeOriginal ? new Date(uploadedFiles[0].dateTimeOriginal).getTime() : new Date().getTime();

        // Check if an event with the same type and date already exists
        const eventAlreadyExists = existingEvents.some(event => 
            event.type === collectionName && event.date === eventDate
        );

        if (eventAlreadyExists) {
            console.log(`%cUpload completion event for collection ${collectionName} on ${new Date(eventDate).toLocaleDateString()} already exists. Skipping creation.`, `color: orange;`);
            return; // Do not create a new event
        }

        const eventId = `upload-completion-${collectionId}-${new Date().getTime()}`;
        const uploadCompletionEvent = {
            id: eventId,
            type: collectionName,
            date: eventDate,
            location: '',
            crews: [],
            collectionId: collectionId,
            filesCount: uploadedFiles.length,
            totalSize: importFileSize,
        };

        await updateDoc(projectDocRef, {
            events: arrayUnion(uploadCompletionEvent)
        });

        console.log(`%cAdded upload completion event for Project ${projectId} in ${domain} successfully.`, `color: #54a134;`);
    } catch (error) {
        console.error(`%cError adding upload completion event to Project ${projectId} in ${domain}: ${error.message}`, `color: red;`);
        throw error;
    }
};
