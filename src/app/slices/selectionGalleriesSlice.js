import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createSelectionGallery as apiCreate,
  fetchSelectionGalleries as apiList,
  fetchSelectionGallery as apiGet,
  updateSelectionGallery as apiUpdate,
  activateSelectionGallery as apiActivate,
  completeSelectionGallery as apiComplete,
  reopenSelectionGallery as apiReopen,
  deleteSelectionGallery as apiDelete,
} from '../../firebase/functions/selection-gallery-firestore';
import { showAlert } from './alertSlice';

export const fetchGalleries = createAsyncThunk(
  'selectionGalleries/fetchAll',
  async ({ domain, projectId }) => {
    const galleries = await apiList(domain, projectId);
    return { projectId, galleries };
  }
);

export const fetchGallery = createAsyncThunk(
  'selectionGalleries/fetchOne',
  async ({ domain, projectId, galleryId }) => {
    const gallery = await apiGet(domain, projectId, galleryId);
    return { projectId, gallery };
  }
);

export const createGallery = createAsyncThunk(
  'selectionGalleries/create',
  async ({ domain, projectId, payload, createdBy }, { dispatch }) => {
    const gallery = await apiCreate(domain, projectId, { ...payload, createdBy });
    dispatch(showAlert({ type: 'success', message: `Selection gallery "${gallery.name}" created.` }));
    return { projectId, gallery };
  }
);

export const updateGallery = createAsyncThunk(
  'selectionGalleries/update',
  async ({ domain, projectId, galleryId, updates, updatedBy }) => {
    await apiUpdate(domain, projectId, galleryId, updates, updatedBy);
    return { projectId, galleryId, updates };
  }
);

export const activateGallery = createAsyncThunk(
  'selectionGalleries/activate',
  async ({ domain, projectId, galleryId, updatedBy }, { dispatch }) => {
    await apiActivate(domain, projectId, galleryId, updatedBy);
    dispatch(showAlert({ type: 'success', message: 'Selection gallery activated. Client can now select.' }));
    return { projectId, galleryId };
  }
);

export const completeGallery = createAsyncThunk(
  'selectionGalleries/complete',
  async ({ domain, projectId, galleryId, completedBy }) => {
    await apiComplete(domain, projectId, galleryId, { completedBy });
    return { projectId, galleryId };
  }
);

export const reopenGallery = createAsyncThunk(
  'selectionGalleries/reopen',
  async ({ domain, projectId, galleryId, updatedBy }, { dispatch }) => {
    await apiReopen(domain, projectId, galleryId, updatedBy);
    dispatch(showAlert({ type: 'success', message: 'Selection gallery reopened.' }));
    return { projectId, galleryId };
  }
);

export const deleteGallery = createAsyncThunk(
  'selectionGalleries/delete',
  async ({ domain, projectId, galleryId }) => {
    await apiDelete(domain, projectId, galleryId);
    return { projectId, galleryId };
  }
);

const selectionGalleriesSlice = createSlice({
  name: 'selectionGalleries',
  initialState: {
    byProject: {},
    activeGalleryId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setActiveGallery: (state, action) => {
      state.activeGalleryId = action.payload;
    },
    clearGalleries: (state, action) => {
      if (action.payload) delete state.byProject[action.payload];
      else state.byProject = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGalleries.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGalleries.fulfilled, (state, action) => {
        state.loading = false;
        state.byProject[action.payload.projectId] = action.payload.galleries;
      })
      .addCase(fetchGalleries.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        const { projectId, gallery } = action.payload;
        if (!gallery) return;
        const list = state.byProject[projectId] || [];
        const idx = list.findIndex((g) => g.id === gallery.id);
        if (idx >= 0) list[idx] = gallery;
        else list.push(gallery);
        state.byProject[projectId] = list;
      })
      .addCase(createGallery.fulfilled, (state, action) => {
        const { projectId, gallery } = action.payload;
        state.byProject[projectId] = [...(state.byProject[projectId] || []), gallery];
        state.activeGalleryId = gallery.id;
      })
      .addCase(updateGallery.fulfilled, (state, action) => {
        const { projectId, galleryId, updates } = action.payload;
        state.byProject[projectId] = (state.byProject[projectId] || []).map((g) =>
          g.id === galleryId ? { ...g, ...updates } : g
        );
      })
      .addCase(activateGallery.fulfilled, (state, action) => {
        const { projectId, galleryId } = action.payload;
        state.byProject[projectId] = (state.byProject[projectId] || []).map((g) =>
          g.id === galleryId ? { ...g, status: 'active', activatedAt: Date.now() } : g
        );
      })
      .addCase(completeGallery.fulfilled, (state, action) => {
        const { projectId, galleryId } = action.payload;
        state.byProject[projectId] = (state.byProject[projectId] || []).map((g) =>
          g.id === galleryId ? { ...g, status: 'completed', completedAt: Date.now() } : g
        );
      })
      .addCase(reopenGallery.fulfilled, (state, action) => {
        const { projectId, galleryId } = action.payload;
        state.byProject[projectId] = (state.byProject[projectId] || []).map((g) =>
          g.id === galleryId ? { ...g, status: 'active', completedAt: null } : g
        );
      })
      .addCase(deleteGallery.fulfilled, (state, action) => {
        const { projectId, galleryId } = action.payload;
        state.byProject[projectId] = (state.byProject[projectId] || []).filter((g) => g.id !== galleryId);
      });
  },
});

export const { setActiveGallery, clearGalleries } = selectionGalleriesSlice.actions;
export const selectGalleriesForProject = (state, projectId) => state.selectionGalleries?.byProject?.[projectId] || [];
export const selectActiveGalleryId = (state) => state.selectionGalleries?.activeGalleryId || null;
export default selectionGalleriesSlice.reducer;
