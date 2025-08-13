import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSmartGalleryFromFirestore, updateSmartGallerySectionsInFirestore } from '../../firebase/functions/smartGalleryFirestore';

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

export const updateSmartGallerySections = createAsyncThunk(
  'smartGallery/updateSmartGallerySections',
  async ({ domain, projectId, collectionId, sections }) => {
    await updateSmartGallerySectionsInFirestore(domain, projectId, collectionId, sections);
    return sections; // Return the updated sections to update the Redux state
  }
);

const smartGallerySlice = createSlice({
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
      .addCase(updateSmartGallerySections.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateSmartGallerySections.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.data) {
          state.data.sections = action.payload;
          state.data.updatedAt = Date.now(); // Update updatedAt timestamp
        }
      })
      .addCase(updateSmartGallerySections.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default smartGallerySlice.reducer;

export const selectSmartGallery = (state) => state.smartGallery.data;
export const selectSmartGalleryStatus = (state) => state.smartGallery.status;
export const selectSmartGalleryError = (state) => state.smartGallery.error;
