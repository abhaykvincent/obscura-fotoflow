import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateGalleryTagline } from '../../firebase/functions/studios';
import { 
    fetchPricingGroups, 
    createPricingGroup, 
    updatePricingGroup, 
    deletePricingGroup 
} from '../../firebase/functions/pricing';

const DEFAULT_PLANS_TEMPLATE = [
    { id: 'core', name: 'Core', price: 0, features: ['20GB Storage', 'Basic Support'], active: true },
    { id: 'freelancer', name: 'Freelancer', price: 29, features: ['1TB Storage', 'Priority Support', 'Custom Branding'], active: true },
    { id: 'studio', name: 'Studio', price: 99, features: ['Unlimited Storage', '24/7 Support', 'API Access', 'White Label'], active: true }
];

export const updateGalleryTaglineAsync = createAsyncThunk(
  'adminSettings/updateGalleryTagline',
  async ({ studioId, tagline }, { rejectWithValue }) => {
    try {
      await updateGalleryTagline(studioId, tagline);
      return tagline;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// -- Pricing Thunks --

export const fetchPricingGroupsAsync = createAsyncThunk(
    'adminSettings/fetchPricingGroups',
    async (_, { rejectWithValue }) => {
        try {
            const groups = await fetchPricingGroups();
            return groups;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const addPricingGroupAsync = createAsyncThunk(
    'adminSettings/addPricingGroup',
    async (groupData, { rejectWithValue }) => {
        try {
            const newGroup = {
                ...groupData,
                id: groupData.id || `group_${Date.now()}`,
                plans: groupData.plans || JSON.parse(JSON.stringify(DEFAULT_PLANS_TEMPLATE))
            };
            const createdGroup = await createPricingGroup(newGroup);
            return createdGroup;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updatePricingGroupAsync = createAsyncThunk(
    'adminSettings/updatePricingGroup',
    async ({ id, updates }, { rejectWithValue }) => {
        try {
            await updatePricingGroup(id, updates);
            return { id, updates };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deletePricingGroupAsync = createAsyncThunk(
    'adminSettings/deletePricingGroup',
    async (id, { rejectWithValue }) => {
        try {
            await deletePricingGroup(id);
            return id;
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
    pricingGroups: [],
    editingPricingGroup: null,
    editingPricingPlan: null,
    loading: false,
    error: null,
  },
  reducers: {
    setGalleryTagline: (state, action) => {
      state.settings.gallery.galleryTagline = action.payload;
    },
    setEditingPricingGroup: (state, action) => {
      state.editingPricingGroup = action.payload;
    },
    setEditingPricingPlan: (state, action) => {
      state.editingPricingPlan = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Gallery Tagline
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
      })

      // Fetch Pricing Groups
      .addCase(fetchPricingGroupsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPricingGroupsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.pricingGroups = action.payload;
      })
      .addCase(fetchPricingGroupsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Pricing Group
      .addCase(addPricingGroupAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPricingGroupAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.pricingGroups.push(action.payload);
      })
      .addCase(addPricingGroupAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Pricing Group
      .addCase(updatePricingGroupAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePricingGroupAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { id, updates } = action.payload;
        const index = state.pricingGroups.findIndex(g => g.id === id);
        if (index !== -1) {
            state.pricingGroups[index] = { ...state.pricingGroups[index], ...updates };
        }
      })
      .addCase(updatePricingGroupAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Pricing Group
      .addCase(deletePricingGroupAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePricingGroupAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.pricingGroups = state.pricingGroups.filter(g => g.id !== action.payload);
      })
      .addCase(deletePricingGroupAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
    setGalleryTagline, 
    setEditingPricingGroup,
    setEditingPricingPlan
} = adminSettingsSlice.actions;

export const selectPricingGroups = (state) => state.adminSettings.pricingGroups;
export const selectEditingPricingGroup = (state) => state.adminSettings.editingPricingGroup;
export const selectEditingPricingPlan = (state) => state.adminSettings.editingPricingPlan;

export default adminSettingsSlice.reducer;
