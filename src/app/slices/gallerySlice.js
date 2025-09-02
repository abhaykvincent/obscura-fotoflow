import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: 'workflowMode', // or 'designMode'
};

export const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    setGalleryMode: (state, action) => {
      state.mode = action.payload;
    },
  },
});

export const { setGalleryMode } = gallerySlice.actions;

export const selectGalleryMode = (state) => state.gallery.mode;

export default gallerySlice.reducer;
