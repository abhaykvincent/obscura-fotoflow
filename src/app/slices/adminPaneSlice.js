import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createDummyProjectsInFirestore } from '../../firebase/functions/firestore';
import { addUser } from './usersSlice'; // Import addUser thunk
import { generateDummyUserData } from '../../utils/dummyDataUtils'; // Import the utility function
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/app';
import { convertTimestamps } from '../../utils/firestoreUtils';

const initialState = {
  loading: false,
  error: null,
  firestoreData: null,
};

export const fetchAllFirestoreData = createAsyncThunk(
  'adminPane/fetchAllFirestoreData',
  async (domain, { rejectWithValue }) => {
    try {
      const data = {};
      const collections = ['users', 'leads', 'pricings', 'referrals', 'subscriptions', 'invoices', 'studios', 'pricingGroups'];

      // 1. Fetch Top-Level Collections
      for (const colName of collections) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        data[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
      }

      // 2. Fetch Domain-Specific Data (if domain exists)
      if (domain) {
        // --- Projects ---
        const projectsRef = collection(db, 'studios', domain, 'projects');
        const projectSnapshot = await getDocs(projectsRef);
        const projects = projectSnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
        data['projects'] = projects;

        // Fetch subcollections for each project
        const collectionsMap = {};
        const eventsMap = {};
        const subProjectsMap = {};

        await Promise.all(projects.map(async (project) => {
          // Collections
          const colsRef = collection(db, 'studios', domain, 'projects', project.id, 'collections');
          const colsSnap = await getDocs(colsRef);
          if (!colsSnap.empty) {
            collectionsMap[project.id] = colsSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
          }

          // Events
          const eventsRef = collection(db, 'studios', domain, 'projects', project.id, 'events');
          const eventsSnap = await getDocs(eventsRef);
          if (!eventsSnap.empty) {
            eventsMap[project.id] = eventsSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
          }

          // SubProjects
          const subProjRef = collection(db, 'studios', domain, 'projects', project.id, 'subProjects');
          const subProjSnap = await getDocs(subProjRef);
          if (!subProjSnap.empty) {
            subProjectsMap[project.id] = subProjSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
          }
        }));

        if (Object.keys(collectionsMap).length > 0) data['projects::collections'] = collectionsMap;
        if (Object.keys(eventsMap).length > 0) data['projects::events'] = eventsMap;
        if (Object.keys(subProjectsMap).length > 0) data['projects::subProjects'] = subProjectsMap;


        // --- Packages ---
        const packagesRef = collection(db, 'studios', domain, 'packages');
        const packagesSnap = await getDocs(packagesRef);
        data['packages'] = packagesSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));

        // --- Selection Requests ---
        const selectionReqRef = collection(db, 'studios', domain, 'selectionRequests');
        const selectionReqSnap = await getDocs(selectionReqRef);
        data['selectionRequests'] = selectionReqSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));

        // --- Conversations ---
        const conversationsRef = collection(db, 'studios', domain, 'conversations');
        const conversationsSnap = await getDocs(conversationsRef);
        const conversations = conversationsSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
        data['conversations'] = conversations;

        // Fetch messages for each conversation
        const messagesMap = {};
        await Promise.all(conversations.map(async (conversation) => {
            const msgsRef = collection(db, 'studios', domain, 'conversations', conversation.id, 'messages');
            const msgsSnap = await getDocs(msgsRef);
            if (!msgsSnap.empty) {
                messagesMap[conversation.id] = msgsSnap.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
            }
        }));
        if (Object.keys(messagesMap).length > 0) data['conversations::messages'] = messagesMap;
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDummyProjects = createAsyncThunk(
  'adminPane/addDummyProjects',
  async ({ domain, count }, { rejectWithValue }) => {
    try {
      await createDummyProjectsInFirestore(domain, count);
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDummyUsers = createAsyncThunk(
  'adminPane/addDummyUsers',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const usersToCreate = 20;
      for (let i = 0; i < usersToCreate; i++) {
        const userData = generateDummyUserData();
        await dispatch(addUser(userData)).unwrap();
      }
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const adminPaneSlice = createSlice({
  name: 'adminPane',
  initialState,
  reducers: {
    clearFirestoreData: (state) => {
      state.firestoreData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addDummyProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDummyProjects.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addDummyProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addDummyUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDummyUsers.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addDummyUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllFirestoreData.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.firestoreData = null;
      })
      .addCase(fetchAllFirestoreData.fulfilled, (state, action) => {
        state.loading = false;
        state.firestoreData = action.payload;
      })
      .addCase(fetchAllFirestoreData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFirestoreData } = adminPaneSlice.actions;
export default adminPaneSlice.reducer;
