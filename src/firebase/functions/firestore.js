
import { db, storage } from "../app";
import { ref, deleteObject } from "firebase/storage";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, increment} from "firebase/firestore";

import { deleteCollectionFromStorage, deleteProjectFromStorage } from "../../utils/storageOperations";
import { generateMemorablePIN, generateRandomString, toKebabCase, toTitleCase} from "../../utils/stringUtils";
import { removeUndefinedFields } from "../../utils/generalUtils";



// Users
export const createUser = async (userData) => {
    const {email,studio,displayName,photoURL} = userData;
    console.log(displayName)
    const usersCollection = collection(db, 'users');
    const userDoc = {
        displayName: displayName,
        email : email,
        studio : studio,
        photoURL : photoURL,
    }
    await setDoc(doc(usersCollection, userDoc.email), userDoc)
    return userDoc
}
export const fetchUsers = async () => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return usersData;
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
// Referrals
export const fetchAllReferalsFromFirestore  = async () => {
    const referralsCollection = collection(db, 'referrals');
    const querySnapshot = await getDocs(referralsCollection);
    const referalData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    
    return referalData;
};
export const generateReferralInFirebase = async (referralData) => {
    const referralsCollection = collection(db, 'referrals');
    
    // Get all existing referrals
    const querySnapshot = await getDocs(referralsCollection);
    const existingReferrals = querySnapshot.docs.map(doc => doc.data());
    
    // Get the forced code or generate a new one
    const forceCode = referralData.code[0];
    let finalCode = forceCode;
    
    console.log(referralData)

    // If no force code, generate unique code
    if (!forceCode) {
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!isUnique && attempts < maxAttempts) {
            const generatedCode = `${toKebabCase(referralData.name)}-${generateMemorablePIN(8)}`
            const codeExists = existingReferrals.some(referral => 
                referral.code.includes(generatedCode)
            );
            
            if (!codeExists) {
                finalCode = generatedCode;
                isUnique = true;
            }
            attempts++;
        }
        
        if (!isUnique) {
            throw new Error('Unable to generate unique referral code after multiple attempts');
        }
    } else {
        // Check if forced code already exists
        const codeExists = existingReferrals.some(referral => 
            referral.code.includes(forceCode)
        );
        
        if (codeExists) {
            throw new Error('Provided referral code already exists');
        }
    }
    const referralDoc = {
        ...referralData,
        code: [finalCode],
    };
    const documentId = `${toKebabCase(referralData.name)}-${generateRandomString(4)}`;

    await setDoc(doc(referralsCollection, documentId), referralDoc);

    return referralDoc;
};

export const validateInvitationCodeFromFirestore = async (invitationCode) =>{
    const referralsCollection = collection(db, 'referrals');
    const querySnapshot = await getDocs(referralsCollection);
    const referalData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    // IF REFERAL STATUS IS active
    const referal = referalData.find((referal) => {
        return referal.code.includes(invitationCode) && referal.status === 'active'
    });
    return referal;
}
export const acceptInvitationCode = async (invitationCode) => {
    
    
    const referralsCollection = collection(db, 'referrals');
    const querySnapshot = await getDocs(referralsCollection);
    const referalData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const referal = referalData.find((referal) => {
 
        return referal.code.includes(invitationCode) && referal.status === 'active'

    });
    // update referal used increment and  status to passive if used is equal to quota
    if(referal?.used < referal?.quota-1){
        referal.used = referal?.used + 1;
    }
    else{
        referal.used = referal?.used + 1;
        referal.status = 'passive';

    }
    await updateDoc(doc(referralsCollection, referal.id), referal);
    return referal;
}


// Projects //
export const fetchProjectsFromFirestore = async (domain) => {
    try{
        console.log(domain)
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
      ...project
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
export const deleteProjectFromFirestore = async (domain, projectId) => {
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
            deleteProjectFromStorage(domain, projectId); // Assuming you also pass the domain to this function
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
            console.log(`%cProject status updated to "${status}" successfully for project: ${projectId}.`, `color: #54a134;`);
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
            console.log(`%cProject lastOpened updated successfully for project: ${projectId}.`, `color: #54a134;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating lastOpened for project: ${projectId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
  
// Collection Operations
export const addCollectionToStudioProject = async (domain, projectId, collectionData) => {
    const { name, status } = collectionData;
    const id = `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;

    const collectionDoc = {
        id: `${id}`,
        name,
        status,
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
      console.log('Collection name updated successfully 🎉');
    } catch (error) {
      console.error('Error updating collection name:', error.message);
      throw error;
    }
  };
// Uploaded Files
export const fetchImages = async (domain, projectId, collectionId) => {
    let color = domain === '' ? 'gray' : '#0099ff';
   
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const subCollectionId = `${collectionId}`;
    const collectionDocRef = doc(projectDocRef, 'collections', subCollectionId);
    const collectionSnapshot = await getDoc(collectionDocRef);

    if (collectionSnapshot.exists()) {
        const collectionsData = collectionSnapshot.data();
        if(collectionsData.uploadedFiles?.length > 0){
            collectionsData.uploadedFiles.sort((a, b) => a.name.localeCompare(b.name));
        }
        else{
        }
        return collectionsData.uploadedFiles;
    } else {
        return []
    }
};
export const addUploadedFilesToFirestore = async (domain, projectId, collectionId, importFileSize, uploadedFiles) => {
    let color = domain === '' ? 'gray' : 'green';
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const subCollectionId = `${collectionId}`;
    const collectionDocRef = doc(projectDocRef, 'collections', subCollectionId);
    const targetStudioRef = doc(db, 'studios', domain);

    const projectData = await getDoc(projectDocRef);

    if (projectData.exists()) {
        const collectionData = await getDoc(collectionDocRef);

        if (!collectionData.exists()) {
            throw new Error('Collection does not exist.');
        }
        // Update collection with new data, including filesCount
        updateDoc(collectionDocRef, {
            uploadedFiles: arrayUnion(...uploadedFiles),
        })
        .catch(error => {
            console.error(`%cError adding uploaded files to collection ${collectionId} in project ${projectId}: ${error.message}`, `color: red;`);
            throw error;
        });

        const pin = generateMemorablePIN(4)
        updateDoc(projectDocRef, {
            collections: projectData.data().collections.map(collection => {
                if (collection.id === collectionId) {
                    return {
                        ...collection,
                        galleryCover : collection?.galleryCover? collection.galleryCover : uploadedFiles[0]?.url,
                        favoriteImages: collection?.favoriteImages  ? collection.favoriteImages :[uploadedFiles.length>=2 ? uploadedFiles[1]?.url:'',uploadedFiles.length>=3 ? uploadedFiles[2]?.url:''],
                        filesCount: (collection.filesCount || 0) + uploadedFiles.length,
                    };
                }
                return collection; // Return the original collection if id doesn’t match
            }),
            totalFileSize: importFileSize + projectData.data().totalFileSize,
            uploadedFilesCount: projectData.data().uploadedFilesCount + uploadedFiles.length,
            projectCover: projectData.data().projectCover === '' ? uploadedFiles[0]?.url : projectData.data().projectCover,
            status: "uploaded",
            pin: projectData.data().pin || generateMemorablePIN(4),
        })
        .then(() => {

        })
        .catch(error => {
            console.error(`%cError updating project ${projectId}: ${error.message}`, `color: red;`);
            throw error;
        });
            
        await updateDoc(studioDocRef, {
            "usage.storage.used": increment(importFileSize)
        })
            .then(() => {
                console.log('Studio storage updated successfully!');
            })
            .catch((error) => {
                console.error('Error updating studio storage:', error);
            });
        

        return({pin})
        color = '#54a134';
       
    } else {
        console.error('Project not found.');
        throw new Error('Project not found.');
    }
};
export const deleteFileFromFirestoreAndStorage = async (domain, projectId, collectionId, fileUrl, fileName) => {
    // Validate required parameters
    if (!domain || !projectId || !collectionId || !fileUrl || !fileName) {
        throw new Error('Domain, Project ID, Collection ID, File URL, and File Name are required.');
    }

    console.log(`Deleting file ${fileName} from project: ${projectId}, collection: ${collectionId}`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const collectionDocRef = doc(projectDocRef, 'collections', collectionId);

    try {
        // 1. Delete from Firebase Storage
        const storageRef = ref(storage, `${domain}/${projectId}/${collectionId}/${fileName}`);
        await deleteObject(storageRef);
        console.log(`File ${fileName} deleted from Firebase Storage`);

        // 2. Remove from Firestore
        const collectionSnapshot = await getDoc(collectionDocRef);
        if (!collectionSnapshot.exists()) {
            throw new Error('Collection does not exist.');
        }

        const collectionData = collectionSnapshot.data();
        const updatedFiles = collectionData.uploadedFiles.filter(file => file.url !== fileUrl || file.name !== fileName);

        await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedFiles });
        console.log(`File ${fileName} removed from Firestore`);
    } catch (error) {
        console.error('Error deleting file:', error.message);
        throw error;
    }
};
// Photo Selection
export const addSelectedImagesToFirestore = async (domain, projectId, collectionId, images, page, size, totalPages) => {
    if (!domain || !projectId || !collectionId || !images) {
        throw new Error('Domain, Project ID, Collection ID, and Images are required.');
    }

    let status = page === totalPages ? 'selected' : 'selecting';
    console.log(`%cUpdating image statuses for project: ${projectId}, collection: ${collectionId}`, `color: #0099ff;`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const subCollectionId = collectionId;
    const collectionDocRef = doc(projectDocRef, 'collections', subCollectionId);

    try {
        const collectionSnapshot = await getDoc(collectionDocRef);

        if (!collectionSnapshot.exists()) {
            console.log(`%cCollection ${collectionId} does not exist.`, 'color: red;');
            throw new Error('Collection does not exist.');
        }

        const collectionData = collectionSnapshot.data();

        const updatedImages = collectionData.uploadedFiles.map((image, index) => {
            const startIndex = (page - 1) * size;
            const endIndex = page * size;

            if (index >= startIndex && index < endIndex) {
                const isSelected = images.some(img => img.url === image.url);
                return {
                    ...image,
                    status: isSelected ? 'selected' : image.status || 'unselected'
                };
            } else {
                return image; // Retain the status for images outside the current page range
            }
        });

        await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedImages });

        // Update status on the project
        const projectSnapshot = await getDoc(projectDocRef);
        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            await updateDoc(projectDocRef, { ...projectData, status: status });
            console.log(`%cSelected images status updated successfully for project: ${projectId}.`, `color: #54a134;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating image status for project: ${projectId}, collection: ${collectionId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
export const removeUnselectedImagesFromFirestore = async (domain, projectId, collectionId, images, page, size, totalPages) => {
    if (!domain || !projectId || !collectionId || !images) {
      throw new Error('Domain, Project ID, Collection ID, and Images are required.');
    }
  
    let status = page === totalPages ? 'selected' : 'selecting';
    console.log(`Removing unselected image statuses for project: ${projectId}, collection: ${collectionId}`);
  
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const collectionDocRef = doc(projectDocRef, 'collections', collectionId);
  
    try {
      const collectionSnapshot = await getDoc(collectionDocRef);
      if (!collectionSnapshot.exists()) {
        throw new Error('Collection does not exist.');
      }
  
      const collectionData = collectionSnapshot.data();
      const updatedImages = collectionData.uploadedFiles.map((image) => {
        if (images.some(img => img.url === image.url)) {
          // Mark as unselected if it's in the current unselected images array
          return { ...image, status: 'unselected' };
        } else {
          return image;
        }
      });
  
      await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedImages });
  
      const projectSnapshot = await getDoc(projectDocRef);
      if (projectSnapshot.exists()) {
        const projectData = projectSnapshot.data();
        await updateDoc(projectDocRef, { ...projectData, status: status });
        console.log(`Unselected images status updated successfully for project: ${projectId}.`);
      } else {
        throw new Error('Project does not exist.');
      }
    } catch (error) {
      console.error(`Error updating unselected images: ${error.message}`);
      throw error;
    }
  };
// Cover photo
export const setCoverPhotoInFirestore = async (domain, projectId, image) => {
    if (!domain || !projectId || !image) {
        throw new Error('Domain, Project ID, and Image are required.');
    }

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (projectSnapshot.exists()) {
            await updateDoc(projectDocRef, { projectCover: image });
            console.log(`%cCover photo updated successfully for project: ${projectId}.`, `color: #54a134;`);
        } else {
            console.log(`%cProject ${projectId} does not exist.`, 'color: red;');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error(`%cError updating cover photo for project: ${projectId} - ${error.message}`, 'color: red;');
        throw error;
    }
};
export const setGalleryCoverPhotoInFirestore = async (domain, projectId, collectionId, image) => {
    if (!domain || !projectId || !collectionId || !image) {
        throw new Error('Domain, Project ID, Collection ID, and Image are required.');
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
        const { collections } = projectData;

        // Find the specific collection by collectionId
        const collectionIndex = collections.findIndex(c => c.id === collectionId);
        if (collectionIndex === -1) {
            throw new Error('Collection ID does not exist.');
        }

        // Update the galleryCover for the found collection
        const updatedCollections = [...collections];
        updatedCollections[collectionIndex] = {
            ...updatedCollections[collectionIndex],
            galleryCover: image
        };

        // Save the updated collections array back to Firestore
        await updateDoc(projectDocRef, { collections: updatedCollections });
} catch (error) {
        console.error(`%cError updating gallery cover photo for project: ${projectId}, collection: ${collectionId} - ${error.message}`, 'color: red;');
        throw error;
    }
};

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
// Budget
  export const addBudgetToFirestore = async (domain, projectId, budgetData) => {
    if (!domain || !projectId || !budgetData) {
        throw new Error('Domain, Project ID, and Budget data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding budget to Project ${projectId} under ${domain}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const id = `budget-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
        
        const updatedProject = {
            ...projectData,
            budgets: budgetData, // Assuming budgets is an array in your projectData
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cBudget added to Project ${projectId} under ${domain} successfully.`, `color: ${color};`);

        return budgetData;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding budget to Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
// Payment
export const addPaymentToFirestore = async (domain, projectId, paymentData) => {
    if (!domain || !projectId || !paymentData) {
        throw new Error('Domain, Project ID, and Payment data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding payment to Project ${projectId} under ${domain}`, `color: ${color};`);

    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const id = `payment-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
        
        paymentData = {
            id,
            ...paymentData
        };

        const updatedProject = {
            ...projectData,
            payments: arrayUnion(paymentData),
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cPayment added to Project ${id} under ${domain} successfully.`, `color: ${color};`);

        return id;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding payment to Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};
// Expenses
export const addExpenseToFirestore = async (domain, projectId, expenseData) => {
    if (!domain || !projectId || !expenseData) {
        throw new Error('Domain, Project ID, and Expense data are required.');
    }

    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cAdding expense to Project ${projectId} under ${domain}`, `color: ${color};`);


    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);

    try {
        const projectSnapshot = await getDoc(projectDocRef);

        if (!projectSnapshot.exists()) {
            throw new Error('Project does not exist.');
        }

        const projectData = projectSnapshot.data();
        const id = `expense-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
        
        expenseData = {
            id,
            ...expenseData
        };

        const updatedProject = {
            ...projectData,
            expenses: arrayUnion(expenseData),
        };

        await updateDoc(projectDocRef, updatedProject);

        color = '#54a134';
        console.log(`%cExpense added to Project ${id} under ${domain} successfully.`, `color: ${color};`);

        return expenseData;
    } catch (error) {
        color = 'red';
        console.error(`%cError adding expense to Project ${projectId} under ${domain}: ${error.message}`, `color: ${color};`);
        throw error;
    }
};


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

// Project Operations

/**
 * Create multiple dummy projects for development/testing.
 * @param {string} domain - Studio domain.
 * @param {number} n - Number of dummy projects to create.
 */
export const createDummyProjectsInFirestore = async (domain, n = 5) => {
  for (let i = 1; i <= n; i++) {
    const dummyProject = {
      name: `Test Project ${i}`,
      name2: `Client ${i}`,
      type: i % 2 === 0 ? 'Wedding' : 'Portrait',
      projectValidityMonths: [3, 6, 12][i % 3],
      createdAt: Date.now(),
      status: 'active',
      collections: [],
      events: [],
      payments: [],
      expenses: [],
      budgets: [],
      projectCover: '',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      description: `This is a dummy project for development and testing. #${i}`,
    };
    await addProjectToStudio(domain, dummyProject);
  }
  console.log(`Created ${n} dummy projects in studio: ${domain}`);
};