import { db } from "../app";
import { doc, collection, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { deleteProjectFromStorage } from "../../utils/storageOperations";
import { generateRandomString } from "../../utils/stringUtils";
import { isProduction } from "../../analytics/utils";

// Projects //
export const fetchProjectsFromFirestore = async (domain) => {
    try{
        let color = domain === '' ? 'gray' : '#0099ff';
        const studioDocRef = doc(db, 'studios', domain);
        const projectsCollectionRef = collection(studioDocRef, 'projects');
        let  querySnapshot 

        try {
        querySnapshot = await getDocs(projectsCollectionRef)
        }
        catch (error) {
            let color = 'red';
            console.error(`%cError fetching projects from ${domain ? domain : 'undefined'}:`, `color: ${color};`, error);
            return []; // Return an empty array or handle the error appropriately
        }
        
        const projectsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        color='#54a134';
        console.log(`%cFetched all ${projectsData.length} Projects from ${domain ? domain : 'undefined'}`, `color: ${color}; `);

        return projectsData;
    }
    catch (error) {
        let color = 'red';
        console.error(`%cError fetching projects from ${domain ? domain : 'undefined'}:`, `color: ${color};`, error);
        return []; // Return an empty array or handle the error appropriately
    }
};
export const fetchProject = async (domain, projectId) => {
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDoc = doc(projectsCollectionRef, projectId);
    const projectSnapshot = await getDoc(projectDoc);

    const projectData = projectSnapshot.data();

        if(!isProduction){
            let color = projectData ? '#21ade4ff' : 'gray';
            console.log(`%c 🔥 Project`, `color: ${color};`,projectData);
        }
    projectData.collections = await Promise.all(projectData.collections.map(async (collection) => {
        const subCollectionId = collection.id;
        const collectionDoc = doc(projectDoc, 'collections', subCollectionId);
        const collectionSnapshot = await getDoc(collectionDoc);
    
        if (collectionSnapshot.exists()) {
            const collectionData = collectionSnapshot.data();
            
            // Sort files by file name
            if (collectionData.uploadedFiles && Array.isArray(collectionData.uploadedFiles)) {
                collectionData.uploadedFiles.sort((a, b) => a.name.localeCompare(b.name));
            }

            return { ...collection, ...collectionData, id: collection.id };
        } else {
            throw new Error('Collection does not exist.');
        }
    }));

    
    return projectData;
};

// Project Operations
export const addProjectToStudio = async (domain, project) => {
    // if wedding type and merge name, and name2 and name 
    if (project.type === 'Wedding' && project.name2 && project.name) {
        project.name = `${project.name} & ${project.name2}`;
    }
    const id = project.type !== 'Portfolio'?`${project.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`:'portfolio';
    const projectData = {
      id,
      ...project,
      projectValidityMonths: project.projectValidityMonths || '6',
      fileRetentionYears: project.fileRetentionYears || '1',
      storage: {
        status: 'active',
        storageHistory: [{
          status: 'active',
          dateMoved: Date.now()
        }]
      }
    };
  
    try {
      const studioDocRef = doc(db, 'studios', domain);
      const projectsCollectionRef = collection(studioDocRef, 'projects');
      await setDoc(doc(projectsCollectionRef, id), projectData);
      console.log("Project added successfully 🎉");
      return projectData;
    } catch (error) {
      console.error('Error adding project:', error.message);
      throw error;
    }
};
export const deleteProjectFromFirestore = async (domain, bucketUrl, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required for deletion.');
    }
    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cDeleting Project ${projectId} from ${domain ? domain : 'undefined'}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const docSnapshot = await getDoc(projectDocRef);

        if (docSnapshot.exists()) {
            await deleteDoc(projectDocRef);
            color = '#54a134';
            console.log(`%cProject ${projectId} deleted successfully from ${domain}`, `color: ${color};`);
            deleteProjectFromStorage(domain,bucketUrl, projectId); // Assuming you also pass the domain to this function
        } else {
            color = 'red';
            console.error(`%cProject ${projectId} does not exist in ${domain}`, `color: ${color};`);
            throw new Error('Project does not exist.');
        }
    } 
    catch (error) {
        color = 'red';
        console.error(`%cError deleting project ${projectId} from ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
export const updateProjectNameInFirestore = async (domain, projectId, newName) => {
    try {
      const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);
      await updateDoc(projectDocRef, { name: newName });
      console.log('Project name updated successfully 🎉');
    } catch (error) {
      console.error('Error updating project name:', error.message);
      throw error;
    }
  };
export const updateProjectStatusInFirestore = async (domain, projectId, status) => {
    if (!domain || !projectId || !status) {
        throw new Error('Domain, Project ID, and status are required.');
    }

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            await updateDoc(projectDocRef, { status });
            let statusColor = status === 'active' ? '#54a134' : status === 'selected' ? '#b55ee4ff' : status === 'deleted' ? 'red' : 'gray'
            console.log(`%cProject status - Updated to "${status}"  %c${projectId}.`, `color: #54a134;`, `color: ${statusColor}; font-weight: bold;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating project status for project: ${projectId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
export const updateProjectLastOpenedInFirestore = async (domain, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required.');
    }

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            // Update the lastOpened field to the current time
            await updateDoc(projectDocRef, { lastOpened: new Date().getTime() });
            console.log(`%c👆🏽Last Opened - Updated! ${projectId} `, `color: #54a134;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating lastOpened for project: ${projectId} - ${error.message}`, 'color: red;');
        throw error;
    }
};

export const updateProjectStorageToArchive = async (domain, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required for archiving.');
    }

    const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            
            if (projectData.storage?.status === 'archive') {
                console.log(`Project ${projectId} is already archived.`);
                return;
            }

            const newStorageHistoryEntry = {
                status: 'archive',
                dateMoved: Date.now(),
            };

            const updatedData = {
                storage: {
                    ...projectData.storage,
                    status: 'archive',
                    storageHistory: arrayUnion(newStorageHistoryEntry)
                }
            };

            await updateDoc(projectDocRef, updatedData);
            console.log(`Project ${projectId} storage status updated to archive.`);

            // Decrement studio storage usage (Hot Storage)
            const studioDocRef = doc(db, 'studios', domain);
            await updateDoc(studioDocRef, {
                "usage.storage.used": increment(-(projectData.totalFileSize || 0))
            });
        } else {
            console.error(`Project ${projectId} does not exist.`);
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`Error updating project storage for ${projectId}: ${error.message}`);
        throw error;
    }
};

export const restoreProjectFromArchive = async (domain, projectId) => {
    if (!domain || !projectId) {
        throw new Error('Domain and Project ID are required for restoration.');
    }

    const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            const now = Date.now();

            const newStorageHistoryEntry = {
                status: 'active',
                dateMoved: now,
            };

            const updatedData = {
                storage: {
                    ...projectData.storage,
                    status: 'active',
                    lastRestoredAt: now,
                    storageHistory: arrayUnion(newStorageHistoryEntry)
                }
            };

            await updateDoc(projectDocRef, updatedData);
            console.log(`Project ${projectId} storage status restored to active.`);

            // Increment studio storage usage back (Hot Storage)
            const studioDocRef = doc(db, 'studios', domain);
            await updateDoc(studioDocRef, {
                "usage.storage.used": increment(projectData.totalFileSize || 0)
            });
        } else {
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`Error restoring project storage for ${projectId}: ${error.message}`);
        throw error;
    }
};

export const migrateProjectsValidityFields = async () => {
    try {
        const studiosCollectionRef = collection(db, 'studios');
        const studiosSnapshot = await getDocs(studiosCollectionRef);
        let totalUpdated = 0;

        for (const studioDoc of studiosSnapshot.docs) {
            const domain = studioDoc.id;
            const projectsCollectionRef = collection(db, 'studios', domain, 'projects');
            const projectsSnapshot = await getDocs(projectsCollectionRef);

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                const updates = {};

                // Migration logic:
                // If fileRetentionYears is missing, it's an old project.
                // Old projectValidityMonths (1, 2, 3) were actually years.
                if (!projectData.fileRetentionYears) {
                    const oldValidity = parseInt(projectData.projectValidityMonths || '1');
                    
                    if (oldValidity <= 3) {
                        // It was years
                        updates.fileRetentionYears = String(oldValidity);
                        updates.projectValidityMonths = '3'; // Default gallery validity
                    } else {
                        // It might already be in months or default
                        updates.fileRetentionYears = '1';
                        updates.projectValidityMonths = String(oldValidity);
                    }
                }

                if (Object.keys(updates).length > 0) {
                    const projectDocRef = doc(db, 'studios', domain, 'projects', projectDoc.id);
                    await updateDoc(projectDocRef, updates);
                    totalUpdated++;
                }
            }
        }

        console.log(`Migration complete. Updated ${totalUpdated} projects.`);
        return totalUpdated;
    } catch (error) {
        console.error('Error migrating projects validity fields:', error);
        throw error;
    }
};
