// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess } from '../../data/teams';
import { addCollectionToFirestore, addCrewToFirestore, addEventToFirestore, addProjectToFirestore, deleteCollectionFromFirestore, deleteProjectFromFirestore, fetchProjectsFromFirestore } from '../../firebase/functions/firestore';
import { showAlert } from './alertSlice';


const initialState = {
  data: [],
  status: 'idle',
  loading : false,
  error: null,
};
// Projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects', 
  fetchProjectsFromFirestore
);

export const addProject = createAsyncThunk(
  'projects/addProject',
  (project) => addProjectToFirestore(project)
);


export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  (projectId) => { deleteProjectFromFirestore(projectId);
    return projectId;
  }
);
// Collections
export const addCollection = createAsyncThunk(
  'projects/addCollection',
  async ({ projectId, newCollection }, { dispatch }) => {
    const id = await addCollectionToFirestore(projectId, newCollection);
    return {projectId, collection: {id,...newCollection}}
  }
);

export const deleteCollection = createAsyncThunk(
  'projects/deleteCollection',
  async ({ projectId, collectionId }, { dispatch }) => {
    await deleteCollectionFromFirestore(projectId, collectionId);
    return { projectId, collectionId };
  }
);
// Event
export const addEvent = createAsyncThunk(
  'projects/addEvent',
  async ({ projectId, newEvent }, { dispatch }) => {
    const id = await addEventToFirestore(projectId, newEvent);
    return ({projectId:projectId, newEvent:{id, ...newEvent}})
  }
);
// Crew
export const addCrew = createAsyncThunk(
  'projects/addCrew',
  async ({ projectId, eventId, crewData }, { dispatch }) => {
    await addCrewToFirestore(projectId, eventId, crewData);
    return { projectId, eventId, crewData };
  }
);


const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects_temp: (state, action) => {
      state.data = action.payload;
    },
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
        state.status = 'idle';
        state.loading = false;
        state.data.push(action.payload);
      })
     .addCase(addProject.rejected, (state, action) => {
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
        state.status = 'idle';
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
        state.status = 'idle';
        state.loading = false;
        const { projectId, collection } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedCollections = [...project.collections, collection];
            return { ...project, collections: updatedCollections };
          }
          return project;
        });
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
        state.status = 'idle';
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
      // Add Event
      builder
      .addCase(addEvent.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.status = 'idle';
        state.loading = false;
        const { projectId, newEvent } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedEvents = [...project.events, newEvent];
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
        state.status = 'idle';
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
  },
});

export const { setProjects_temp } = projectsSlice.actions;
export default projectsSlice.reducer;

// Selector to get projects data from the state
export const selectProjects = (state) => state.projects.data;
export const selectLoading = (state) => state.projects.loading;