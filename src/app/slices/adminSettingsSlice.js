import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateGalleryTagline, updateStudioLogo, updateStudio } from '../../firebase/functions/studios';
import { uploadStudioLogo } from '../../utils/uploadOperations';
import { 
    fetchPricingGroups, 
    createPricingGroup, 
    updatePricingGroup, 
    deletePricingGroup 
} from '../../firebase/functions/pricing';

const DEFAULT_PLANS_TEMPLATE = [
    { 
        id: 'core', 
        name: 'Core', 
        slug: 'core',
        description: 'Essential tools for hobbyists.',
        type: 'public',
        status: 'active',
        sortOrder: 0,
        pricing: {
            currency: 'USD',
            tiers: [
                { interval: 'month', price: 0, stripePriceId: '' },
                { interval: 'year', price: 0, stripePriceId: '' }
            ],
            trialPeriodDays: 0,
            setupFee: 0
        },
        limits: {
            storageGb: 20,
            maxProjects: 3,
            maxGalleries: -1,
            maxTeamMembers: 1,
            fileUploadSizeMb: 100,
            bandwidthGb: 10
        },
        features: {
            permissions: { canRemoveBranding: false, canUseCustomDomain: false },
            displayList: [{ text: '20GB Storage' }, { text: 'Basic Support' }]
        },
        ui: { colorTheme: '#4f46e5', highlight: false, ctaText: 'Get Started' },
        active: true 
    },
    { 
        id: 'freelancer', 
        name: 'Freelancer',
        slug: 'freelancer', 
        description: 'For growing photography businesses.',
        type: 'public',
        status: 'active',
        sortOrder: 1,
        pricing: {
            currency: 'USD',
            tiers: [
                { interval: 'month', price: 29, stripePriceId: '' },
                { interval: 'year', price: 290, stripePriceId: '', discountLabel: '2 Months Free' }
            ],
            trialPeriodDays: 14,
            setupFee: 0
        },
        limits: {
            storageGb: 1000,
            maxProjects: 50,
            maxGalleries: -1,
            maxTeamMembers: 1,
            fileUploadSizeMb: 2000,
            bandwidthGb: 500
        },
        features: {
            permissions: { canRemoveBranding: true, canUseCustomDomain: true },
            displayList: [{ text: '1TB Storage' }, { text: 'Priority Support' }, { text: 'Custom Branding' }]
        },
        ui: { colorTheme: '#10b981', highlight: true, badgeText: 'Most Popular', ctaText: 'Start Free Trial' },
        active: true 
    },
    { 
        id: 'studio', 
        name: 'Studio',
        slug: 'studio', 
        description: 'Powerhouse features for agencies.',
        type: 'public',
        status: 'active',
        sortOrder: 2,
        pricing: {
            currency: 'USD',
            tiers: [
                { interval: 'month', price: 99, stripePriceId: '' },
                { interval: 'year', price: 990, stripePriceId: '' }
            ],
            trialPeriodDays: 14,
            setupFee: 0
        },
        limits: {
            storageGb: -1,
            maxProjects: -1,
            maxGalleries: -1,
            maxTeamMembers: 5,
            fileUploadSizeMb: 5000,
            bandwidthGb: 2000
        },
        features: {
            permissions: { canRemoveBranding: true, canUseCustomDomain: true, hasApiAccess: true },
            displayList: [{ text: 'Unlimited Storage' }, { text: '24/7 Support' }, { text: 'API Access' }, { text: 'White Label' }]
        },
        ui: { colorTheme: '#f59e0b', highlight: false, ctaText: 'Contact Sales' },
        active: true 
    }
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

export const updateStudioAsync = createAsyncThunk(
  'adminSettings/updateStudio',
  async ({ studioId, updates }, { rejectWithValue }) => {
    try {
      await updateStudio(studioId, updates);
      return updates;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStudioLogoAsync = createAsyncThunk(
  'adminSettings/updateStudioLogo',
  async ({ file, studioDomain }, { rejectWithValue }) => {
    try {
      const logoUrl = await uploadStudioLogo(file, studioDomain);
      return logoUrl;
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
      studio: {
        studioLogo: '',
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

      // Update Studio
      .addCase(updateStudioAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudioAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Merge updates into settings if applicable, or just clear loading
        // Since settings structure in slice might differ from Firestore, 
        // we might not want to overcomplicate state sync here if it's 
        // already handled by re-fetching or other slices.
      })
      .addCase(updateStudioAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Studio Logo
      .addCase(updateStudioLogoAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudioLogoAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.studio.studioLogo = action.payload;
      })
      .addCase(updateStudioLogoAsync.rejected, (state, action) => {
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
export const selectStudioAdminSettings  = (state) => state.adminSettings;
export default adminSettingsSlice.reducer;
