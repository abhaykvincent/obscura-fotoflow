// slices/uploadSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';

const initialState = {
  name: 'Obscura',
  domain: 'obscura',
  plan:['Free Trial'],
  limits:{
    storage: {
      // In MB 
      // 1 GB - 1000
      total: 5000,
      available:1
    },
    projects:{

    },
    collections:{
      perProject: 3
    }
  },
  loading : false,
  error: null,
};

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    setAvailableStortage: (state, action) => {
      const available = state.limits.storage.total-getUsedSpace(action.payload)
      state.limits.storage.available=available
    },
  },
  extraReducers: (builder) => {
  },
});

export const { setAvailableStortage } = studioSlice.actions;
export default studioSlice.reducer;

// Selector to get projects data from the state
export const selectStorageLimit = (state) => state.studio.limits.storage;
export const selectCollectionsLimit = (state) => state.studio.limits.collections;
