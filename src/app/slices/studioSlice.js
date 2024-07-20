// slices/uploadSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: 'Obscura',
  domain: 'obscura',
  plan:['Free Trial'],
  limits:{
    storage: {
      'total': 4,
      'available':0.001
    }
  },
  loading : false,
  error: null,
};

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    setUploadList: (state, action) => {
      console.log(action.payload)
    },
  },
  extraReducers: (builder) => {
  },
});

export const { setUploadList } = studioSlice.actions;
export default studioSlice.reducer;

// Selector to get projects data from the state
export const selectStorageLimit = (state) => state.studio.limits.storage;
