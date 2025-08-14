import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess } from '../../data/teams';
import { addBudgetToFirestore, addCollectionToFirestore, addCollectionToStudioProject, addCrewToFirestore, addEventToFirestore, addExpenseToFirestore, addPaymentToFirestore, addProjectToStudio, deleteCollectionFromFirestore, deleteFileFromFirestoreAndStorage, deleteProjectFromFirestore, fetchInvitationFromFirebase, fetchProjectsFromFirestore, updateCollectionNameInFirestore, updateCollectionSelectionStatusByCollectionIdInFirestore, updateSelectionGalleryStatusByCollectionIdInFirestore, updateCollectionStatusByCollectionIdInFirestore, updateInvitationInFirebase, updateProjectNameInFirestore, updateProjectStatusInFirestore, updateProjectStorageToArchive } from '../../firebase/functions/firestore';
import { showAlert } from './alertSlice';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/app';
import { convertTimestamps } from '../../utils/firestoreUtils';


const initialState = {
  data: [],
  status: 'login',
  loading : false,
  error: null,
};
// Projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async ({ currentDomain }) => {
    const projects = await fetchProjectsFromFirestore(currentDomain);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const processedProjects = await Promise.all(projects.map(async (project) => {
      // Ensure createdAt exists and is a valid timestamp, and the project is not already archived
      if (project.createdAt && typeof project.createdAt === 'number' && project.storage?.status !== 'archive') {
        const createdAtDate = new Date(project.createdAt);

        // Check if the project's creation date is before 3 months ago
        if (createdAtDate < threeMonthsAgo) {
          // Update the project in Firestore
          await updateProjectStorageToArchive(currentDomain, project.id);
          
          const newStorageHistoryEntry = {
            status: 'archive',
            dateMoved: Date.now(),
          };

          // Return a new project object with updated storage information for the Redux state
          return {
            ...project,
            storage: {
              ...project.storage, // Preserve existing storage properties
              status: 'archive',
              storageHistory: project.storage?.storageHistory
              ? [...project.storage.storageHistory, newStorageHistoryEntry]
              : [newStorageHistoryEntry],
            },
          };
        }
      }
      // Return the project as is if it doesn't meet the archive criteria
      return project;
    }));

    return convertTimestamps(processedProjects);
  }
);

export const checkFirestoreConnection = createAsyncThunk(
  'projects/checkFirestoreConnection',
  async () => {
      return checkFirestoreConnection()
  }
)

export const addProject = createAsyncThunk(
  'projects/addProject',
  ({domain,projectData}) => {
    const data = addProjectToStudio(domain,projectData)
    return convertTimestamps(data)}
);
export const updateProjectName = createAsyncThunk(
  'projects/updateProjectName',
  async ({ domain, projectId, newName }, { dispatch }) => {
    // Call Firestore function to update project name
    await updateProjectNameInFirestore(domain, projectId, newName);
    return { projectId, newName };
  }
);

export const updateProjectStatus = createAsyncThunk(
  'projects/updateProjectStatus',
  async ({ domain, projectId, newStatus }, { dispatch }) => {
    await updateProjectStatusInFirestore(domain, projectId, newStatus);
    return { projectId, newStatus };
  }
);
export const updateCollectionName = createAsyncThunk(
  'projects/updateCollectionName',
  async ({ domain, projectId, collectionId, newName }, { dispatch }) => {
    // Call Firestore function to update collection name
    await updateCollectionNameInFirestore(domain, projectId, collectionId, newName);
    return { projectId, collectionId, newName };
  }
);

export const updateCollectionStatus = createAsyncThunk(
  'projects/updateCollectionStatus',
  async ({ domain, projectId, collectionId, status }, { dispatch }) => {
    await updateCollectionStatusByCollectionIdInFirestore(domain, projectId, collectionId, status);
    return { projectId, collectionId, status };
  }
);


export const updateSelectionGalleryStatus = createAsyncThunk(
  'projects/updateSelectionGalleryStatus',
  async ({ domain, projectId, collectionId, status }, { dispatch }) => {
    await updateSelectionGalleryStatusByCollectionIdInFirestore(domain, projectId, collectionId, status);
    return { projectId, collectionId, status };
  }
);
export const updateCollectionSelectionStatus = createAsyncThunk(
  'projects/updateCollectionSelectionStatus',
  async ({ domain, projectId, collectionId, status }, { dispatch }) => {
    await updateCollectionSelectionStatusByCollectionIdInFirestore(domain, projectId, collectionId, status);
    return { projectId, collectionId, status };
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  ({domain,projectId}) => { 
    deleteProjectFromFirestore(domain, projectId);
    return projectId;
  }
);

// Collections
export const addCollection = createAsyncThunk(
  'projects/addCollection',
  async ({ domain, projectId, newCollection }, { dispatch }) => {
    const id = await addCollectionToStudioProject(domain,projectId, newCollection);
    return convertTimestamps({projectId, collection: {id,...newCollection}})
  }
);

export const deleteCollection = createAsyncThunk(
  'projects/deleteCollection',
  async ({ domain,projectId, collectionId }, { dispatch }) => {
    await deleteCollectionFromFirestore(domain,projectId, collectionId);
    return { projectId, collectionId };
  }
);
// Event
export const addEvent = createAsyncThunk(
  'projects/addEvent',
  async ({ domain, projectId, newEvent }, { dispatch }) => {
    const id = await addEventToFirestore(domain,projectId, newEvent);
    return convertTimestamps({projectId:projectId, newEvent:{id, ...newEvent}})
  }
);
// Crew
export const addCrew = createAsyncThunk(
  'projects/addCrew',
  async ({ domain, projectId, eventId, crewData }, { dispatch }) => {
    await addCrewToFirestore(domain, projectId, eventId, crewData);
    return convertTimestamps({ projectId, eventId, crewData });
  }
);
// Financials
// Payments
export const addPayment =  createAsyncThunk(
  'projects/addPayment',
  async ({ domain,projectId, paymentData }, { dispatch }) => {
    await addPaymentToFirestore(domain, projectId, paymentData);
    return convertTimestamps({ projectId, paymentData });
  }
);
// Expenses
export const addExpense =  createAsyncThunk(
  'projects/addExpense',
  async ({ domain,projectId, paymentData }, { dispatch }) => {
    await addExpenseToFirestore(domain,projectId, paymentData);
    return convertTimestamps({ projectId, expenseData:paymentData });
  }
);
export const addBudget =  createAsyncThunk(
  'projects/addBudget',
  async ({ domain,projectId, budgetData }, { dispatch }) => {
    budgetData = await addBudgetToFirestore(domain, projectId, budgetData);
    return convertTimestamps({projectId,budgetData});
  }
);export const deleteFile = createAsyncThunk(
  'projects/deleteFile',
  async ({ studioName, projectId, collectionId, imageUrl, imageName }, { dispatch }) => {
    // Call the function to delete the file
    await deleteFileFromFirestoreAndStorage(studioName, projectId, collectionId, imageUrl, imageName);
    return { projectId, collectionId, fileName: imageName }; // Return necessary data
  }
);
// Invitations
export const updateInvitation = createAsyncThunk(
  'projects/updateInvitation',
  async ({ domain, projectId, invitationData }, { dispatch }) => {
    const updatedInvitationId = await updateInvitationInFirebase(domain, projectId, invitationData);
    return convertTimestamps({ projectId, invitationData, updatedInvitationId });
  }
);
export const fetchInvitation = createAsyncThunk(
  'invitations/fetchInvitation',
  async ({ domain, projectId }) => {
    const invitation = await fetchInvitationFromFirebase(domain, projectId);
    return convertTimestamps(invitation);
  }
);
// Upload Cover
export const updateProjectCover = createAsyncThunk(
  "projects/updateProjectCover",
  async ({ domain, projectId, newCoverUrl, focusPoint }) => {
      const projectDocRef = doc(db, "studios", domain, "projects", projectId);
      await updateDoc(projectDocRef, { projectCover: newCoverUrl, focusPoint });
      return { projectId, newCoverUrl, focusPoint };
  }
);
// Sub Projects
export const createSubProject = createAsyncThunk(
  "projects/createSubProject",
  async ({ domain, parentProjectId, subProjectData }) => {
    const subProjectsCollectionRef = collection(
      db,
      "studios",
      domain,
      "projects",
      parentProjectId,
      "subProjects"
    );

    const subProjectDocRef = await addDoc(subProjectsCollectionRef, subProjectData);
    return { parentProjectId, subProjectId: subProjectDocRef.id, subProjectData };
  }
);





const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects_temp: (state, action) => {
      state.data = action.payload;
    },
    updateProjectsStatus: (state, action) => {
      state.status = action.payload;
    }
  
  },
  extraReducers: (builder) => {

    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      
      // Add project
      builder
      .addCase(addProject.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
     .addCase(addProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.data.push(action.payload);
        
      })
     .addCase(addProject.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      builder
      .addCase(updateProjectName.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(updateProjectName.fulfilled, (state, action) => {
        const { projectId, newName } = action.payload;
        state.data = state.data.map((project) => 
          project.id === projectId ? { ...project, name: newName } : project
        );
        state.loading = false;
        state.status = 'succeeded';
      })
      .addCase(updateProjectName.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      builder
      .addCase(updateProjectStatus.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        const { projectId, newStatus } = action.payload;
        state.data = state.data.map((project) =>
          project.id === projectId ? { ...project, status: newStatus } : project
        );
        state.loading = false;
        state.status = 'succeeded';
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Delete project
      builder
      .addCase(deleteProject.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log("deleted id is "+action.payload)
        state.loading = false;
        state.data = state.data.filter(project => project.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Add collection
      builder
      .addCase(addCollection.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addCollection.fulfilled, (state, action) => {
        const { projectId, collection } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedCollections = [...project.collections, collection];
            return { ...project, collections: updatedCollections };
          }
          return project;
        });
        state.loading = false;
        state.status = 'succeeded';

      })
      .addCase(addCollection.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete collection
      builder
      .addCase(deleteCollection.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, collectionId } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedCollections = project.collections.filter(collection => collection.id!== collectionId);
            return { ...project, collections: updatedCollections };
          }
        return project;
        }
      )})
      .addCase(deleteCollection.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      builder
      .addCase(updateCollectionName.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(updateCollectionName.fulfilled, (state, action) => {
        const { projectId, collectionId, newName } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedCollections = project.collections.map((collection) =>
              collection.id === collectionId ? { ...collection, name: newName } : collection
            );
            return { ...project, collections: updatedCollections };
          }
          return project;
        });
        state.loading = false;
        state.status = 'succeeded';
      })
      .addCase(updateCollectionName.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      builder
      .addCase(updateCollectionStatus.pending, (state) => {
      })
      .addCase(updateCollectionStatus.fulfilled, (state, action) => {
        const { projectId, collectionId, status } = action.payload;
        const projectToUpdate = state.data.find((project) => project.id === projectId);
        if (projectToUpdate) {
          const collectionToUpdate = projectToUpdate.collections.find(
            (collection) => collection.id === collectionId
          );
          if (collectionToUpdate) {
            collectionToUpdate.status = status;
          }
        }
      })
      .addCase(updateCollectionStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });

      builder
      .addCase(updateSelectionGalleryStatus.pending, (state) => {
      })
      .addCase(updateSelectionGalleryStatus.fulfilled, (state, action) => {
        const { projectId, collectionId, status } = action.payload;
        const projectToUpdate = state.data.find((project) => project.id === projectId);
        if (projectToUpdate) {
          const collectionToUpdate = projectToUpdate.collections.find(
            (collection) => collection.id === collectionId
          );
          if (collectionToUpdate) {
            collectionToUpdate.selectionGallery = status;
          }
        }
      })
      .addCase(updateSelectionGalleryStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
      
      builder
      .addCase(updateCollectionSelectionStatus.pending, (state) => {
      })
      .addCase(updateCollectionSelectionStatus.fulfilled, (state, action) => {
        const { projectId, collectionId, status } = action.payload;
        const projectToUpdate = state.data.find((project) => project.id === projectId);
        if (projectToUpdate) {
          const collectionToUpdate = projectToUpdate.collections.find(
            (collection) => collection.id === collectionId
          );
          if (collectionToUpdate) {
            collectionToUpdate.selectionStatus = status;
          }
        }
      })
      .addCase(updateCollectionSelectionStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });

      builder
      .addCase(deleteFile.pending, (state) => {
      })
      
      .addCase(deleteFile.fulfilled, (state, action) => {
      })
    
      .addCase(deleteFile.rejected, (state, action) => {
        state.error = action.error.message;
      });
      // Add Event
      builder
      .addCase(addEvent.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, newEvent } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedEvents = [...project.events, convertTimestamps(newEvent)];
            return { ...project, events: updatedEvents };
          }
          return project;
        });
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      // Add Crue
      builder
      .addCase(addCrew.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addCrew.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, eventId, crewData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedEvents = project.events.map((event) => {
              if (event.id === eventId) {
                const updatedCrew = [...event.crews, crewData];
                return { ...event, crews: updatedCrew };
              }
              return event;
            });
            return { ...project, events: updatedEvents };
          }
          return project;
        });
      })
      .addCase(addCrew.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Add payment
      builder
      .addCase(addPayment.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
     .addCase(addPayment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, paymentData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedPayments = [...project.payments, paymentData];
            return { ...project, payments: updatedPayments };
          }
          return project;
        });
      })
     .addCase(addPayment.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Add Expense
      builder
      .addCase(addExpense.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, expenseData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedExpenses = [...project.expenses, expenseData];
            return { ...project, expenses: updatedExpenses };
          }
          return project;
        });
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });


      // set Budget
      builder
     .addCase(addBudget.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addBudget.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, budgetData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            return { ...project, budgets: budgetData };
          }
          return project;
        });
      })
     .addCase(addBudget.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });

      // INVITATION
      // Add the cases to the slice reducer
      builder
      .addCase(updateInvitation.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(updateInvitation.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, invitationData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            return { ...project, invitation: { ...project.invitation, ...invitationData } };
          }
          return project;
        });
        console.log('Invitation data updated:', invitationData);
      })
      .addCase(updateInvitation.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchInvitation.fulfilled, (state, action) => {
        const { projectId } = action.payload;
        //find project and add invitation
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            return { ...project, invitation: action.payload.invitation };
          }
          return project;
        });
      });

      // update project cover
      builder
        // Handle pending state
        .addCase(updateProjectCover.pending, (state) => {
            state.loading = true;
        })
        // Handle fulfilled state
        .addCase(updateProjectCover.fulfilled, (state, action) => {
            const { projectId, newCoverUrl, focusPoint } = action.payload;
            if(projectId){
                state.data = state.data.map((project) => {
                    if (project.id === projectId) {
                        return { ...project, projectCover: newCoverUrl, focusPoint };
                    }
                    return project;
                });
            }
            state.loading = false;
            state.error = null;
        })
        // Handle rejected state
        .addCase(updateProjectCover.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        });

        builder
      .addCase(createSubProject.fulfilled, (state, action) => {
        const { parentProjectId, subProjectId, subProjectData } = action.payload;
        const parentProject = state.projects.find((p) => p.id === parentProjectId);
        if (parentProject) {
          if (!parentProject.subProjects) {
            parentProject.subProjects = [];
          }
          parentProject.subProjects.push({
            id: subProjectId,
            ...subProjectData,
          });
        }
      });
  },
});

export const { setProjects_temp,updateProjectsStatus } = projectsSlice.actions;
export default projectsSlice.reducer;

// Selector to get projects data from the state
export const selectProjects = (state) => state.projects.data;
export const selectProjectsStatus = (state) => state.projects.status;
export const selectLoading = (state) => state.projects.loading;
