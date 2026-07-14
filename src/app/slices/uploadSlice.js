import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploadList: {}, // Changed from array to object
  uploadStatus: 'close',
  loading: false,
  error: null,
};

const calculateWeightedUploadProgress = (uploadParts = {}) => {
  const parts = Object.values(uploadParts);
  if (parts.length === 0) return 0;

  const totalBytes = parts.reduce((sum, part) => sum + (part.totalBytes || 0), 0);

  if (totalBytes > 0) {
    const bytesTransferred = parts.reduce((sum, part) => {
      const transferred = part.status === 'uploaded'
        ? (part.totalBytes || part.bytesTransferred || 0)
        : (part.bytesTransferred || 0);

      return sum + transferred;
    }, 0);

    return Math.min(100, (bytesTransferred / totalBytes) * 100);
  }

  const totalProgress = parts.reduce((sum, part) => sum + (part.progress || 0), 0);
  return totalProgress / parts.length;
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
          uploadParts: file.uploadParts || {
            web: { status: 'pending', progress: 0, bytesTransferred: 0, totalBytes: 0 },
            thumb: { status: 'pending', progress: 0, bytesTransferred: 0, totalBytes: 0 },
          },
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
        const currentFile = state.uploadList[fileId];
        const uploadParts = changes.uploadParts
          ? { ...(currentFile.uploadParts || {}), ...changes.uploadParts }
          : currentFile.uploadParts;
        const nextFile = { ...currentFile, ...changes, uploadParts };

        if (changes.uploadParts) {
          nextFile.progress = calculateWeightedUploadProgress(uploadParts);
        }

        state.uploadList[fileId] = nextFile;
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
