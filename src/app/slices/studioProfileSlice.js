import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchStudioProfileData } from '../../firebase/functions/studios';

export const fetchStudioProfile = createAsyncThunk(
  'studioProfile/fetchStudioProfile',
  async (studioIdentifier, { rejectWithValue }) => {
    try {
      const data = await fetchStudioProfileData(studioIdentifier);
      if (data) {
        return data;
      } else {
        return rejectWithValue(`Studio not found for identifier: ${studioIdentifier}`);
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch studio profile');
    }
  }
);

const studioProfileSlice = createSlice({
  name: 'studioProfile',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearStudioProfile: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudioProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudioProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchStudioProfile.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.error = action.payload;
      });
  },
});

export const { clearStudioProfile } = studioProfileSlice.actions;

export const selectStudioProfile = (state) => state.studioProfile?.data;
export const selectStudioProfileLoading = (state) => state.studioProfile?.loading;
export const selectStudioProfileError = (state) => state.studioProfile?.error;

export default studioProfileSlice.reducer;
