import { db } from "../app";
import { doc, collection, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { generateRandomString } from "../../utils/stringUtils";
import { ensureShootsForUploadedFiles, extractCaptureDateKey } from "./shoot-firestore";

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
        const projectTitle = projectData.projectTitle || projectData.name || collectionName || '';

        // 1. Lookup-before-create: group by YYYY-MM-DD capture date and
        // get-or-create exactly one Shoot doc per calendar date inside a
        // Firestore transaction (race-safe for parallel / multi-gallery uploads).
        // IF existingShoot found -> photo/gallery refs are attached to
        // existingShoot.id; ELSE a single new Shoot
        // { projectId, date, title: projectTitle, createdAt } is created.
        const shootResults = await ensureShootsForUploadedFiles(domain, projectId, uploadedFiles, {
            projectTitle,
            collectionId,
            importFileSize,
        });

        // 2. Keep the legacy project.events array in sync, but dedupe by
        // calendar date / shootId (not by gallery name) so uploads into
        // different galleries on the same date do NOT create duplicates.
        const totalFiles = uploadedFiles.length;
        const sizePerFile = totalFiles > 0 ? importFileSize / totalFiles : 0;
        const eventsToAdd = [];

        for (const { dateKey, shootId, filesCount } of shootResults) {
            const midnight = new Date(`${dateKey}T00:00:00`);
            const timeKey = midnight.getTime();
            const dateKeyFromEvent = (dateVal) => extractCaptureDateKey(dateVal);

            const eventAlreadyExists = existingEvents.some((event) => {
                if (event.shootId && event.shootId === shootId) return true;
                if (event.id && event.id === shootId) return true;
                // Fall back to calendar-date comparison for legacy events
                // that were created per-gallery (type + timestamp).
                try {
                    return dateKeyFromEvent(event.date) === dateKey;
                } catch {
                    return event.date === timeKey;
                }
            }) || eventsToAdd.some((event) => event.shootId === shootId);

            if (!eventAlreadyExists) {
                const eventId = shootId;
                eventsToAdd.push({
                    id: eventId,
                    shootId,
                    type: collectionName,
                    date: timeKey,
                    location: '',
                    crews: [],
                    collectionId,
                    collectionIds: [collectionId],
                    filesCount,
                    totalSize: Number((sizePerFile * filesCount).toFixed(2)),
                });
            } else {
                console.log(`%cUpload completion event for ${dateKey} already exists (shoot ${shootId}). Skipping creation.`, `color: orange;`);
            }
        }

        if (eventsToAdd.length > 0) {
            await updateDoc(projectDocRef, {
                events: arrayUnion(...eventsToAdd)
            });
            console.log(`%cAdded ${eventsToAdd.length} upload completion event(s) for Project ${projectId} in ${domain} successfully.`, `color: #54a134;`);
        }

        return shootResults;
    } catch (error) {
        console.error(`%cError adding upload completion event to Project ${projectId} in ${domain}: ${error.message}`, `color: red;`);
        throw error;
    }
};
