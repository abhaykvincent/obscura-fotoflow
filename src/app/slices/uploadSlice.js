import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploadList: {}, // Changed from array to object
  uploadStatus: 'close',
  loading: false,
  error: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadStatus: (state, action) => { // Renamed from setUploadStatuss
      state.uploadStatus = action.payload;
    },
    startUploadSession: (state, action) => {
      state.uploadList = {}; // Clear previous uploads
      action.payload.forEach((file, index) => {
        // Assuming file objects from action.payload have a 'name' property.
        // Using file.name as a simple unique ID, ensure it's unique in practice or generate a better one.
        const fileId = file.id || `file-${Date.now()}-${index}`; // Use provided ID or generate one
        state.uploadList[fileId] = {
          id: fileId,
          name: file.name,
          size: file.size,
          status: 'pending', // Initial status
          progress: 0,
          url: null,
          rawFile: file, // Store the original file object if needed for upload
          ...file, // Spread any other properties from the input file object
        };
      });
      state.uploadStatus = 'open';
    },
    updateUploadFile: (state, action) => {
      const { fileId, changes } = action.payload;
      if (state.uploadList[fileId]) {
        state.uploadList[fileId] = { ...state.uploadList[fileId], ...changes };
      }
    },
    removeUploadFile: (state, action) => {
      const { fileId } = action.payload;
      delete state.uploadList[fileId];
    },
    clearUploadSession: (state) => {
      state.uploadList = {};
      state.uploadStatus = 'close'; // Or 'completed'
    },
  },
  extraReducers: (builder) => {
    // Potentially handle async thunks if any were added, e.g., for actual uploads
  },
});

export const {
  setUploadStatus,
  startUploadSession,
  updateUploadFile,
  removeUploadFile,
  clearUploadSession,
} = uploadSlice.actions;
export default uploadSlice.reducer;

// Selector to get projects data from the state
export const selectUploadList = (state) => state.upload.uploadList; // Returns an object now
export const selectUploadStatus = (state) => state.upload.uploadStatus;
