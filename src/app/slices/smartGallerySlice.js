import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSmartGalleryFromFirestore, updateSmartGalleryInFirestore } from '../../firebase/functions/smartGalleryFirestore';

const initialState = {
  data: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchSmartGallery = createAsyncThunk(
  'smartGallery/fetchSmartGallery',
  async ({ domain, projectId, collectionId }) => {
    const smartGallery = await fetchSmartGalleryFromFirestore(domain, projectId, collectionId);

    console.log(smartGallery)
    return smartGallery;
  }
);

export const updateSmartGallery = createAsyncThunk(
  'smartGallery/updateSmartGallery',
  async ({ domain, projectId, collectionId, smartGallery }) => {
    await updateSmartGalleryInFirestore(domain, projectId, collectionId, smartGallery);
    return smartGallery; // Return the updated smartGallery to update the Redux state
  }
);

const smartGallerySlice = createSlice
({
  name: 'smartGallery',
  initialState,
  reducers: {
    // You can add synchronous reducers here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSmartGallery.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSmartGallery.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchSmartGallery.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateSmartGallery.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateSmartGallery.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload; // Update the entire smartGallery object
      })
      .addCase(updateSmartGallery.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default smartGallerySlice.reducer;

export const selectSmartGallery = (state) => state.smartGallery.data;
export const selectSmartGalleryStatus = (state) => state.smartGallery.status;
export const selectSmartGalleryError = (state) => state.smartGallery.error;
