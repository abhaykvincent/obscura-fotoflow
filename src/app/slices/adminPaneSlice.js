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

      for (const colName of collections) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        data[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
      }

      // If domain is provided, fetch projects for that domain
      if (domain) {
        const projectsRef = collection(db, 'studios', domain, 'projects');
        const projectSnapshot = await getDocs(projectsRef);
        data[`projects (${domain})`] = projectSnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
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
