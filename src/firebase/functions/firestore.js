
import { db } from "../app";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, writeBatch} from "firebase/firestore";
import {generateMemorablePIN, generateRandomString} from "../../utils/stringUtils";
import { deleteCollectionFromStorage, deleteProjectFromStorage } from "../../utils/storageOperations";
import { update } from "firebase/database";


// Studio
export const createStudio = async (studioData) => {
    console.log(studioData)
    const {name} =studioData;
    const id= `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    
    const studiosCollection = collection(db, 'studios');
    const studioDoc = {
        id : id,
        ...studioData
    }
    return setDoc(doc(studiosCollection, studioDoc.domain), studioDoc)

    .then(() => {
        console.log('Studio created successfully.');
        return studioDoc
    })
    .catch((error) => {
        console.error('Error creating studio:', error.message);

        throw error;
    })
}
export const fetchStudiosOfUser = async (email) => {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const user = usersData.find((user) => user.email === email);
    const studio = user?.studio
    console.log(user)
    return studio;
};
//fetch all studios
export const fetchStudios = async () => {
    const studiosCollection = collection(db, 'studios');
    const querySnapshot = await getDocs(studiosCollection);
    const studiosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return studiosData;
}
// Users
export const createUser = async (userData) => {
    const {email,studio} = userData;
    console.log(userData)
    const usersCollection = collection(db, 'users');
    const userDoc = {
        displayName:'',
        email : email,
        studio : studio
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
// Fetches
// Function to fetch all projects from a specific studio of domain
export const fetchProjectsFromFirestore = async (domain) => {
    let color = domain === '' ? 'gray' : '#0099ff';
    console.log(`%cFetching Projects from ${domain ? domain : 'undefined'}`, `color: ${color}; `);
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const querySnapshot = await getDocs(projectsCollectionRef);

    const projectsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    color='#54a134';
    console.log(`%cFetched all ${projectsData.length} Projects from ${domain ? domain : 'undefined'}`, `color: ${color}; `);

    return projectsData;
};
// Function to fetch a specific project from a specific studio
export const fetchProject = async (domain, projectId) => {
    console.log(domain, projectId)
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
            console.log(collectionSnapshot.data());
            return { ...collection, ...collectionSnapshot.data(), id: collection.id };
        } else {
            throw new Error('Collection does not exist.');
        }
    }));
    console.log(projectData);
    
    return projectData;
};
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
            // green
            color = '#54a134';
            console.log(`%cFetched Images from ${collectionId}`, `color: ${color}; `);
        }
        else{
            // yellow
            color = '#ffa500';
            color = 
            console.log(`%cNo Images found on  ${collectionId}`, `color: ${color}; `);
        }
        return collectionsData.uploadedFiles;
    } else {
        return []
    }
};

  
// Project Operations
export const addProjectToStudio = async (domain, project) => {
    
    console.log(domain, project)
    const id = `${project.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
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

  
// Collection Operations
export const addCollectionToStudioProject = async (domain, projectId, collectionData) => {
    const { name, status } = collectionData;
    console.log(domain)
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
    console.log(domain, projectId, collectionId)
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


// Function to create new event for a project in the cloud firestore
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

// userIs need to be the key valude pair of projectDoc
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
/* const [budgetData, setBudgetData] = useState({
    amount: null
  }); */
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
    console.log(expenseData);

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



// Collection Image Operations
// add array of images to collection as selectedImages
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
  

// Update project status
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

// Set cover photo
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
// Uploaded Files
export const addUploadedFilesToFirestore = async (domain, projectId, collectionId, importFileSize, uploadedFiles) => {
    let color = domain === '' ? 'gray' : 'green';
    console.log(`%cAdding Uploaded Files to Project ${projectId} in ${domain ? domain : 'undefined'}`, `color: ${color}; `);

    const batch = writeBatch(db);
    const studioDocRef = doc(db, 'studios', domain);
    const projectsCollectionRef = collection(studioDocRef, 'projects');
    const projectDocRef = doc(projectsCollectionRef, projectId);
    const subCollectionId = `${collectionId}`;
    const collectionDocRef = doc(projectDocRef, 'collections', subCollectionId);

    const projectData = await getDoc(projectDocRef);

    if (projectData.exists()) {
        const collectionData = await getDoc(collectionDocRef);

        if (!collectionData.exists()) {
            // Create the subcollection document if it doesn't exist
            batch.set(collectionDocRef, { uploadedFiles: [] });
        }

        batch.update(collectionDocRef, { uploadedFiles: arrayUnion(...uploadedFiles) });

        const projectCover = uploadedFiles[0]?.url || '';
        batch.update(projectDocRef, {
            uploadedFilesCount: projectData.data().uploadedFilesCount + uploadedFiles.length,
            totalFileSize: importFileSize + projectData.data().totalFileSize,
            projectCover: projectCover,
            status: "uploaded",
            pin: projectData.data().pin || generateMemorablePIN(4),
        });

        await batch.commit();
        color = '#54a134';
       
    } else {
        console.error('Project not found.');
        throw new Error('Project not found.');
    }
};
