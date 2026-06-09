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

        // Helper to parse date consistently from string, Date object, or Firestore Timestamp
        const parseDate = (dateVal) => {
            if (!dateVal) return new Date();
            if (typeof dateVal.toDate === 'function') {
                return dateVal.toDate();
            }
            return new Date(dateVal);
        };

        // Group uploaded files by normalized date (setHours(0,0,0,0) time)
        const filesByDate = {};
        for (const file of uploadedFiles) {
            const rawDate = parseDate(file?.dateTimeOriginal);
            const normalizedDate = new Date(rawDate);
            normalizedDate.setHours(0, 0, 0, 0);
            const timeKey = normalizedDate.getTime();
            if (!filesByDate[timeKey]) {
                filesByDate[timeKey] = [];
            }
            filesByDate[timeKey].push(file);
        }

        const totalFiles = uploadedFiles.length;
        const sizePerFile = totalFiles > 0 ? importFileSize / totalFiles : 0;
        const eventsToAdd = [];

        for (const [timeKeyStr, files] of Object.entries(filesByDate)) {
            const timeKey = Number(timeKeyStr);
            const eventAlreadyExists = existingEvents.some(event => 
                event.type === collectionName && event.date === timeKey
            );

            if (!eventAlreadyExists) {
                const eventId = `upload-completion-${collectionId}-${timeKey}-${new Date().getTime()}`;
                const uploadCompletionEvent = {
                    id: eventId,
                    type: collectionName,
                    date: timeKey,
                    location: '',
                    crews: [],
                    collectionId: collectionId,
                    filesCount: files.length,
                    totalSize: Number((sizePerFile * files.length).toFixed(2)),
                };
                eventsToAdd.push(uploadCompletionEvent);
            } else {
                console.log(`%cUpload completion event for collection ${collectionName} on ${new Date(timeKey).toLocaleDateString()} already exists. Skipping creation.`, `color: orange;`);
            }
        }

        if (eventsToAdd.length > 0) {
            await updateDoc(projectDocRef, {
                events: arrayUnion(...eventsToAdd)
            });
            console.log(`%cAdded ${eventsToAdd.length} upload completion event(s) for Project ${projectId} in ${domain} successfully.`, `color: #54a134;`);
        }
    } catch (error) {
        console.error(`%cError adding upload completion event to Project ${projectId} in ${domain}: ${error.message}`, `color: red;`);
        throw error;
    }
};
