import { db } from "../app";
import { doc, collection, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { deleteCollectionFromStorage } from "../../utils/storageOperations";
import { generateRandomString } from "../../utils/stringUtils";

// Collection Operations
export const addCollectionToStudioProject = async (domain, projectId, collectionData) => {
    const { name, status } = collectionData;
    const id = `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;

    const collectionDoc = {
        id: `${id}`,
        name,
        status,
        smartGallery: {
            id: `${id}`,
            name: name,
            description: "",
            projectCover: "",
            focusPoint: {
                x: 0.5,
                y: 0.5
            },
            coverSize: "medium",
            textPosition: "center",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            sections: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    };

    try {
        // Reference to the studio document
        const studioDocRef = doc(db, 'studios', domain);

        // Reference to the specific project's document within the studio
        const projectDocRef = doc(studioDocRef, 'projects', projectId);

        // Reference to the collections sub-collection within the project
        const collectionsCollectionRef = collection(projectDocRef, 'collections');

        // Update the project with the new collection ID, name, and status
        await updateDoc(projectDocRef, {
            collections: arrayUnion({ id, name, status }), // Assuming collections is an array in your projectData
        });

        // Create the new collection document in the Firestore
        await setDoc(doc(collectionsCollectionRef, collectionDoc.id), collectionDoc);

        console.log('Collection added to project successfully 🎉');
        return collectionDoc.id;
    } catch (error) {
        console.error('Error adding collection to project:', error.message);
        throw error;
    }
};
export const deleteCollectionFromFirestore = async (domain, projectId, collectionId) => {
    console.log('deleteCollectionFromFirestore')
    if (!domain || !projectId || !collectionId) {
        throw new Error('Domain, Project ID, and Collection ID are required for deletion.');
    }
    
    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cDeleting Collection ${collectionId} from Project ${projectId} in ${domain ? domain : 'undefined'}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            const updatedCollections = projectData.collections.filter(
                (collection) => collection.id !== collectionId
            );

            await updateDoc(projectDocRef, { collections: updatedCollections });
            color = '#54a134';
            console.log(`%cCollection ${collectionId} deleted successfully from Project ${projectId} in ${domain}`, `color: ${color};`);
            deleteCollectionFromStorage(domain, projectId, collectionId); // Assuming you also pass the domain to this function
        } else {
            color = 'red';
            console.error(`%cProject ${projectId} does not exist in ${domain}`, `color: ${color};`);
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        color = 'red';
        console.error(`%cError deleting collection ${collectionId} from Project ${projectId} in ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
export const updateCollectionNameInFirestore = async (domain, projectId, collectionId, newName) => {
    try {
      const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);
      await updateDoc(collectionDocRef, { name: newName });

      const projectDocRef = doc(db, 'studios', domain, 'projects', projectId);
      const projectSnapshot = await getDoc(projectDocRef);

      if (projectSnapshot.exists()) {
        const projectData = projectSnapshot.data();
        const updatedCollections = projectData.collections.map(collection => {
            if (collection.id === collectionId) {
                return { ...collection, name: newName };
            }
            return collection;
        });

        await updateDoc(projectDocRef, { collections: updatedCollections });
      }

      console.log('Collection name updated successfully 🎉');
    } catch (error) {
      console.error('Error updating collection name:', error.message);
      throw error;
    }
  };
export const fetchCollectionStatus = async (domain, projectId, collectionId) => {
    console.log(domain, projectId, collectionId);
    if (!domain || !projectId || !collectionId) {
        throw new Error('Domain, Project ID, and Collection ID are required.');
    }

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const collection = projectData.collections.find(c => c.id === collectionId);
        
        if (collection) {
            return collection.status;
        } else {
            throw new Error('Collection not found in project.');
        }
    } catch (error) {
        console.error(`Error fetching collection status: ${error.message}`);
        throw error;
    }
};

export const updateCollectionStatusByCollectionIdInFirestore = async (domain, projectId, collectionId, status,selectionGallery) => {
    try {

        console.log(status,selectionGallery)
        const projectRef = doc(db, 'studios', domain, 'projects', projectId);
        const projectSnapshot = await getDoc(projectRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const updatedCollections = projectData.collections.map(collection => {
            if (collection.id === collectionId) {
                return { 
                    ...collection, 
                    selectionGallery: selectionGallery !== undefined ? selectionGallery : (collection?.selectionGallery ?? false),
                    status:status,
                    version: 2
                };
            }
            return collection;
        });

        await updateDoc(projectRef, { collections: updatedCollections });
        console.log(`Collection ${collectionId} status updated to ${status} for project ${projectId}`);
    } catch (error) {
        console.error("Error updating collection status:", error);
        throw error;
    }
};


export const updateSelectionGalleryStatusByCollectionIdInFirestore = async (domain, projectId, collectionId, status) => {
    try {
        const projectRef = doc(db, 'studios', domain, 'projects', projectId);
        const projectSnapshot = await getDoc(projectRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const updatedCollections = projectData.collections.map(collection => {
            if (collection.id === collectionId) {
                return { 
                    ...collection, 
                    selectionGallery:status,
                };
            }
            return collection;
        });

        await updateDoc(projectRef, { collections: updatedCollections });
        console.log(`Collection ${collectionId} selection gallery status updated to ${status} for project ${projectId}`);
    } catch (error) {
        console.error("Error updating collection selection gallery status:", error);
        throw error;
    }
};
export const updateCollectionSelectionStatusByCollectionIdInFirestore = async (domain, projectId, collectionId, status) => {
    try {
        const projectRef = doc(db, 'studios', domain, 'projects', projectId);
        const projectSnapshot = await getDoc(projectRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const updatedCollections = projectData.collections.map(collection => {
            if (collection.id === collectionId) {
                return { 
                    ...collection, 
                    selectionStatus:status,
                };
            }
            return collection;
        });

        await updateDoc(projectRef, { collections: updatedCollections });
        console.log(`Collection ${collectionId} selection status updated to ${status} for project ${projectId}`);
    } catch (error) {
        console.error("Error updating collection selection status:", error);
        throw error;
    }
};
