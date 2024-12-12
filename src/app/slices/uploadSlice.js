// slices/uploadSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploadList: [],
  uploadStatus: 'close',
  loading : false,
  error: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadList: (state, action) => {
      if(action.payload.length >0){
        state.uploadList = action.payload;
        state.uploadStatus = 'open';
      }
    },
    setUploadStatuss:(state, action) => {
        state.uploadStatus = action.payload
    }
  },
  extraReducers: (builder) => {
  },
});

export const { setUploadList, setUploadStatuss } = uploadSlice.actions;
export default uploadSlice.reducer;

// Selector to get projects data from the state
export const selectUploadList = (state) => state.upload.uploadList;
export const selectUploadStatus = (state) => state.upload.uploadStatus;

