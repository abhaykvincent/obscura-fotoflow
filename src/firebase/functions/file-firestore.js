import { db } from "../app";
import { doc, getDoc, updateDoc, arrayUnion, increment, collection } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { getStorageForDomain } from "../../utils/uploadOperations";
import { generateMemorablePIN } from "../../utils/stringUtils";
import { fetchSmartGalleryFromFirestore, updateSmartGalleryInFirestore } from './smartGalleryFirestore';
import { organizePhotos } from "../../utils/smartGalleryUtils";
import { updateCollectionStatusByCollectionIdInFirestore } from './collection-firestore';

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
export const addUploadedFilesToFirestore = async (domain, projectId, collectionId, importFileSize, uploadedFiles, sectionId) => {
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
        // Update collection with new data, including filesCount
        // Update collection with new data, including filesCount
        updateDoc(collectionDocRef, {
            uploadedFiles: arrayUnion(...uploadedFiles.map(file => ({...file, dateTimeOriginal: file.dateTimeOriginal}))),
        })
        .catch(error => {
            console.error(`%cError adding uploaded files to collection ${collectionId} in project ${projectId}: ${error.message}`, `color: red;`);
            throw error;
        });

        // Fetch current smart gallery
        const currentSmartGallery = await fetchSmartGalleryFromFirestore(domain, projectId, collectionId);

        // Find the section to update or create a new one if sectionId is not provided or not found
        let updatedSections = [];
        let sectionFound = false;
        console.log(sectionId)
        if (sectionId) {
            updatedSections = currentSmartGallery.sections.map(section => {
                if (section.id === sectionId) {
                    sectionFound = true;
                    
                    const mergedImages = [...section.images, ...uploadedFiles];
                    mergedImages.sort((a, b) => {
                        const dateA = new Date(a.dateTimeOriginal || a.lastModified).getTime();
                        const dateB = new Date(b.dateTimeOriginal || b.lastModified).getTime();
                        return dateA - dateB;
                    });
    
                    return {
                        ...section,
                        images: mergedImages,
                    };
                }
                return section;
            });
        }

        if (!sectionFound) {
            // If sectionId was not provided or not found, organize photos into new sections or merge with existing
            updatedSections = organizePhotos(uploadedFiles, collectionId, currentSmartGallery.sections);
        }

        const updatedSmartGallery = {
            ...currentSmartGallery,
            sections: updatedSections,
            projectCover: projectData.data().projectCover === '' ? uploadedFiles[0]?.url : projectData.data().projectCover
        };
        // Call updateSmartGalleryInFirestore
        await updateSmartGalleryInFirestore(domain, projectId, collectionId, updatedSmartGallery);

        const pin = generateMemorablePIN(4)
        const imageGridEvent = {
            type: 'image-grid',
            id: `image-grid-${collectionId}-${new Date().getTime()}`,
            images: uploadedFiles,
            collectionId: collectionId,
            date: new Date().getTime(),
        };
        updateDoc(projectDocRef, {
            events: arrayUnion(imageGridEvent),
            collections: projectData.data().collections.map(collection => {
                if (collection.id === collectionId) {
                    return {
                        ...collection,
                        galleryCover : collection?.galleryCover? collection.galleryCover : uploadedFiles[0]?.url,
                        favoriteImages: collection?.favoriteImages && collection?.favoriteImages[0] !== ''
                            ? collection.favoriteImages
                            : [
                                uploadedFiles.length >= 2 ? uploadedFiles[1]?.url || '' : '',
                                uploadedFiles.length >= 3 ? uploadedFiles[2]?.url || '' : ''
                              ],
                        filesCount: (collection.filesCount || 0) + uploadedFiles.length,
                    };
                }
                return collection; // Return the original collection if id doesn’t match
            }),
            totalFileSize: importFileSize + projectData.data().totalFileSize,
            uploadedFilesCount: projectData.data().uploadedFilesCount + uploadedFiles.length,
            projectCover: projectData.data().projectCover === '' ? uploadedFiles[0]?.url : projectData.data().projectCover,
            status: "active",
            pin: projectData.data().pin || generateMemorablePIN(4),
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
        const storage = await getStorageForDomain(domain);
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
        updateCollectionStatusByCollectionIdInFirestore(domain, projectId, collectionId, status,true);

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

export const toggleFileFavoriteInFirestore = async (domain, projectId, collectionId, fileUrl) => {
    if (!domain || !projectId || !collectionId || !fileUrl) {
        throw new Error('Domain, Project ID, Collection ID, and File URL are required.');
    }

    const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);

    try {
        const collectionSnapshot = await getDoc(collectionDocRef);
        if (!collectionSnapshot.exists()) {
            throw new Error('Collection does not exist.');
        }

        const collectionData = collectionSnapshot.data();
        const updatedFiles = collectionData.uploadedFiles.map(file => {
            if (file.url === fileUrl) {
                return {
                    ...file,
                    status: file.status === 'selected' ? 'unselected' : 'selected'
                };
            }
            return file;
        });

        await updateDoc(collectionDocRef, { uploadedFiles: updatedFiles });
        console.log(`File favorite status toggled successfully.`);
        
        // Find the updated status to return
        const updatedFile = updatedFiles.find(file => file.url === fileUrl);
        return updatedFile.status;
    } catch (error) {
        console.error('Error toggling file favorite:', error.message);
        throw error;
    }
};

export const updateImageLikeCountInFirestore = async (domain, projectId, collectionId, imageUrl, action = 'increment') => {
    if (!domain || !projectId || !collectionId || !imageUrl) {
        throw new Error('Domain, Project ID, Collection ID, and Image URL are required.');
    }

    const collectionDocRef = doc(db, 'studios', domain, 'projects', projectId, 'collections', collectionId);

    try {
        const collectionSnapshot = await getDoc(collectionDocRef);
        if (!collectionSnapshot.exists()) {
            throw new Error('Collection does not exist.');
        }

        const collectionData = collectionSnapshot.data();
        const updatedFiles = collectionData.uploadedFiles.map(file => {
            if (file.url === imageUrl) {
                const currentLikes = file.likes || 0;
                return { 
                    ...file, 
                    likes: action === 'increment' ? currentLikes + 1 : Math.max(0, currentLikes - 1) 
                };
            }
            return file;
        });

        await updateDoc(collectionDocRef, { ...collectionData, uploadedFiles: updatedFiles });
        const updatedFile = updatedFiles.find(f => f.url === imageUrl);
        return updatedFile.likes;
    } catch (error) {
        console.error(`Error updating image like count: ${error.message}`);
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
