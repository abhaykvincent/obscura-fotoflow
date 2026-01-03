import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { fetchUserOrLeadById } from '../../firebase/functions/firestore';

export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const userData = await fetchUserOrLeadById(userId);
      if (userData) {
        return userData;
      } else {
        return rejectWithValue('User not found');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      });
  },
});

export const selectUserProfile = (state) => state.userProfile.user;
export const selectUserProfileLoading = (state) => state.userProfile.loading;
export const selectUserProfileError = (state) => state.userProfile.error;

export default userProfileSlice.reducer;
