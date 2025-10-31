import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateGalleryTagline } from '../../firebase/functions/studios';

export const updateGalleryTaglineAsync = createAsyncThunk(
  'adminSettings/updateGalleryTagline',
  async ({ studioId, tagline }, { rejectWithValue }) => {
    try {
      debugger
      await updateGalleryTagline(studioId, tagline);
      return tagline;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const adminSettingsSlice = createSlice({
  name: 'adminSettings',
  initialState: {
    settings: {
      gallery: {
        galleryTagline: '',
      },
    },
    loading: false,
    error: null,
  },
  reducers: {
    setGalleryTagline: (state, action) => {
      state.settings.gallery.galleryTagline = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateGalleryTaglineAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGalleryTaglineAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.gallery.galleryTagline = action.payload;
      })
      .addCase(updateGalleryTaglineAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setGalleryTagline } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;
