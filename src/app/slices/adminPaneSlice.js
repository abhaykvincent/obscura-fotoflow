import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createDummyProjectsInFirestore } from '../../firebase/functions/firestore';
import { addUser } from './usersSlice'; // Import addUser thunk
import { generateDummyUserData } from '../../utils/dummyDataUtils'; // Import the utility function

const initialState = {
  loading: false,
  error: null,
};

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
  reducers: {},
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
      });
  },
});

export default adminPaneSlice.reducer;
