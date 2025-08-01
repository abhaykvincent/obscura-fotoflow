import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createDummyProjectsInFirestore } from '../../firebase/functions/firestore';

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
      });
  },
});

export default adminPaneSlice.reducer;
