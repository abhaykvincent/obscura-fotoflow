
import { db } from "../app";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion} from "firebase/firestore";
import {generateRandomString} from "../../utils/stringUtils";
import { deleteCollectionFromStorage, deleteProjectFromStorage } from "../../utils/storageOperations";
import { update } from "firebase/database";


// Studio
export const createStudio = async (studioData) => {
    const {name,status} =studioData;
    const id= `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    
    const studiosCollection = collection(db, 'studios');
    const studioDoc = {
        id : id,
        ...studioData
    }
    return setDoc(doc(studiosCollection, studioDoc.id), studioDoc)

    .then(() => {
        console.log('Studio created successfully.');
    })
    .catch((error) => {
        console.error('Error creating studio:', error.message);

        throw error;
    })
}
export const createUser = async (userData) => {
    const {email,studio} = userData;
    console.log(userData)
    const usersCollection = collection(db, 'users');
    const userDoc = {
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
// Fetches
// Function to fetch all projects from a specific studio
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
    console.log(projectsData)
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
        const subCollectionId = projectId + '-' + collection.id;
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
export const fetchImages = async (projectId,collectionId) => {
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);
    const subCollectionId = projectId+'-'+collectionId;
    const collectionDoc = doc(projectDoc, 'collections', subCollectionId);
    const collectionSnapshot = await getDoc(collectionDoc);


    if (collectionSnapshot.exists()) {
        const collectionsData = collectionSnapshot.data();
        return collectionsData.uploadedFiles
    } else {
        throw new Error('Project does not exist.');
    }
}

  
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
  export const deleteProjectFromFirestore = async (projectId) => {
    if (!projectId) {
      throw new Error('Project ID is required for deletion.');
    }
  
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);
  
    try {
      const docSnapshot = await getDoc(projectDoc);
  
      if (docSnapshot.exists()) {
        await deleteDoc(projectDoc);
        console.log('Project deleted successfully.');
        deleteProjectFromStorage(projectId);
      } else {
        console.log('Document does not exist.');
        // Handle the case where the document doesn't exist
        throw new Error('Project does not exist.');
      }
    } catch (error) {
      console.error('Error deleting project:', error.message);
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

export const deleteCollectionFromFirestore = async (projectId, collectionId) => {
    if (!projectId || !collectionId) {
        throw new Error('Project ID and Collection ID are required for deletion.');
    }

    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    try {
        const projectSnapshot = await getDoc(projectDoc);

        if (projectSnapshot.exists()) {
            const projectData = projectSnapshot.data();
            const updatedCollections = projectData.collections.filter(
                (collection) => collection.id !== collectionId
            );

            await updateDoc(projectDoc, { collections: updatedCollections });
            console.log('Collection deleted successfully.');
            deleteCollectionFromStorage(projectId, collectionId);
        } else {
            console.log('Project document does not exist.');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error('Error deleting collection:', error.message);
        throw error;
    }
};

// Function to create new event for a project in the cloud firestore
export const addEventToFirestore = async (projectId,eventData) => {

    const {type,date,location} =eventData;
    const id= `${type.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;

    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    const eventsCollection = collection(projectDoc, 'events');
    const eventDoc = {
        id : id,
        ...eventData
    }

    return setDoc(doc(eventsCollection, eventDoc.id), eventDoc)
    .then(() => {
        return updateDoc(projectDoc, {
            events: arrayUnion({ id, type, date, location, crews: [] }), // Assuming collections is an array in your projectData
    }) })
    .then(() => {
        console.log('Event added to project successfully.');
        return id
    }) 
    .catch((error) => {
        console.error('Error adding event to project:', error.message);
        throw error;
});
};
// userIs need to be the key valude pair of projectDoc
export const addCrewToFirestore = async (projectId,eventId,userData) => {
    
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    const eventsCollection = collection(projectDoc, 'events');
    const eventDoc = doc(eventsCollection,eventId);

    const projectSnapshot =  await getDoc(projectDoc);
    const projectData = projectSnapshot.data();
    console.log(projectData);

    const event = projectData.events.find(event => event.id === eventId);
    
    let updatedEvent = {
        ...event,
        crews: [...event.crews, userData]
    }
    let updatedProject = {
        ...projectData,
        events: projectData.events.map(event => {
            if (event.id === eventId) {
                return updatedEvent;
            }
            return event;
        }
        )
    }

    return updateDoc(projectDoc, updatedProject)
   .then(() => {
        console.log('User added to Event '+eventId+' successfully.');
         
        return eventId;
    })
    .catch((error) => {
        console.error('Error adding user to project:', error.message);
        throw error;
    });
};
// Budget
/* const [budgetData, setBudgetData] = useState({
    amount: null
  }); */
export const addBudgetToFirestore = async (projectId,budgetData) => {
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    const projectSnapshot =  await getDoc(projectDoc);
    const projectData = projectSnapshot.data();
    
    const id= `budget-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    
    const updatedProject = {
        ...projectData,
        budgets:budgetData, // Assuming collections is an array in your projectData
    }

    return updateDoc(projectDoc, updatedProject)
    .then(() => {
        console.log('Budget added to project successfully.');
        return budgetData
    })
    .catch((error) => {
        console.error('Error adding budget to project:', error.message);
        throw error;
    });



};
// Payment
export const addPaymentToFirestore = async (projectId,paymentData) => {
    
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);


    const projectSnapshot =  await getDoc(projectDoc);
    const projectData = projectSnapshot.data();

    const id= `payment-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    paymentData =  {
        id,
        ...paymentData
    }
    const updatedProject = {
        ...projectData,
        payments: arrayUnion(paymentData), // Assuming collections is an array in your projectData
    }


    return updateDoc(projectDoc, updatedProject)
   .then(() => {
        console.log('Payment added to Project '+id+' successfully.');
        return id;
    })
    .catch((error) => {
        console.error('Error adding payment to project:', error.message);
        throw error;
    });
};

// Expenses
export const addExpenseToFirestore = async (projectId,expenseData) => {
    console.log(expenseData);
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    const projectSnapshot =  await getDoc(projectDoc);
    const projectData = projectSnapshot.data();
    const id= `expense-${projectData.name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    expenseData =  {
        id,
        ...expenseData
    }
    const updatedProject = {
        ...projectData,
        expenses: arrayUnion(expenseData), // Assuming collections is an array in your projectData
    }

    return updateDoc(projectDoc, updatedProject)
    .then(() => {
        console.log('Expense added to Project '+id+' successfully.');
        return expenseData;
    })
    .catch((error) => {
        console.error('Error adding expense to project:', error.message);
        throw error;
    });
};


// Collection Image Operations
// add array of images to collection as selectedImages
export const addSelectedImagesToFirestore = async (projectId, collectionId, images, page, size,totalPages) => {
    if (!projectId || !collectionId || !images) {
        throw new Error('Project ID, Collection ID, and Images are required.');
    }

    let status = page===totalPages? 'selected' : 'selecting';
    console.log(images)
    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);
    const subCollectionId = projectId + '-' + collectionId;
    const collectionDoc = doc(projectDoc, 'collections', subCollectionId);
    try {
        const collectionSnapshot = await getDoc(collectionDoc);
        const collectionData = collectionSnapshot.data();

        if (collectionSnapshot.exists()) {
            const updatedImages = collectionData.uploadedFiles.map((image) => {
                const imageIndex = collectionData.uploadedFiles.indexOf(image);
                const startIndex = (page - 1) * size;
                const endIndex = page * size;

                if (imageIndex >= startIndex && imageIndex < endIndex) {
                    console.log(images.includes(image.url) ? 'selected' : '')

                    const isSelected = images.some(img => img.url === image.url);
                
                    return {
                        ...image,
                        status: isSelected ? 'selected' : image.status || 'unselected'
                    };
                } else {
                    return image; // retain the status if outside the page and size range
                }
            });



            await updateDoc(collectionDoc, {...collectionData,uploadedFiles:updatedImages});
            // update status on projeect
            const projectSnapshot = await getDoc(projectDoc);
            const projectData = projectSnapshot.data();
            
            await updateDoc(projectDoc, {...projectData, status: status});
            console.log('Selected images status updated successfully.');

        } else {
            console.log('Collection document does not exist.');
            throw new Error('Collection does not exist.');
        }
    } catch (error) {
        console.error('Error updating image status:', error.message);
        throw error;
    }
}
// Update project status
export const updateProjectStatusInFirestore = async (projectId, status) => {
    if (!projectId || !status) {
        throw new Error('Project ID and status are required.');
    }
    

    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    try {
        const projectSnapshot = await getDoc(projectDoc);

        if (projectSnapshot.exists()) {
            await updateDoc(projectDoc, { status: status });
            console.log('Project status updated successfully.');
        } else {
            console.log('Project document does not exist.');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error('Error updating project status:', error.message);
        throw error;
    }
}
// Set cover photo
export const setCoverPhotoInFirestore = async (projectId, image) => {
    if (!projectId || !image) {
        throw new Error('Project ID and Image are required.');
    }

    const projectsCollection = collection(db, 'projects');
    const projectDoc = doc(projectsCollection, projectId);

    try {
        const projectSnapshot = await getDoc(projectDoc);
        const projectData = projectSnapshot.data();

        if (projectSnapshot.exists()) {
            await updateDoc(projectDoc, { projectCover: image });
            console.log('Cover photo updated successfully.');
        } else {
            console.log('Project document does not exist.');
            throw new Error('Project does not exist.');
        }
    } catch (error) {
        console.error('Error updating cover photo:', error.message);
        throw error;
    }
}