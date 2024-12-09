import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth } from '../../firebase/app';
import { fetchStudioByDomain, fetchUsers } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';
import { setUserType } from '../../analytics/utils';

const initialState = {
  data:{}
};
export const fetchStudio = createAsyncThunk(
  'studio/fetchStudio',
  async ({ currentDomain}) => {
    try {
        const studio = await fetchStudioByDomain(currentDomain);
        console.log(studio)
        return studio;
    } catch (error) {
      throw error;
    }
  }
);

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudio.fulfilled, (state, action) => {
        state.loading = false;
        state.data= action.payload;
        state.error = null;
      })
      .addCase(fetchStudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { } = studioSlice.actions;
export default studioSlice.reducer;

export const selectStudio = (state) => state.studio.data;
