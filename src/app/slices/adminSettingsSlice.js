import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateGalleryTagline } from '../../firebase/functions/studios';

const DEFAULT_PLANS_TEMPLATE = [
    { id: 'core', name: 'Core', price: 0, features: ['20GB Storage', 'Basic Support'], active: true },
    { id: 'freelancer', name: 'Freelancer', price: 29, features: ['1TB Storage', 'Priority Support', 'Custom Branding'], active: true },
    { id: 'studio', name: 'Studio', price: 99, features: ['Unlimited Storage', '24/7 Support', 'API Access', 'White Label'], active: true }
];

const MOCK_PRICING_GROUPS = [
    {
        id: 'default_2024',
        name: 'Standard Pricing 2024',
        description: 'The main public pricing tier',
        plans: JSON.parse(JSON.stringify(DEFAULT_PLANS_TEMPLATE))
    },
    {
        id: 'holiday_special',
        name: 'Holiday Special',
        description: 'Discounted rates for Q4',
        plans: [
            { id: 'core', name: 'Core', price: 0, features: ['20GB Storage'], active: true },
            { id: 'freelancer', name: 'Freelancer', price: 19, features: ['1TB Storage', 'Priority Support'], active: true },
            { id: 'studio', name: 'Studio', price: 79, features: ['Unlimited Storage', 'White Label'], active: true }
        ]
    }
];

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
    pricingGroups: MOCK_PRICING_GROUPS,
    editingPricingGroup: null,
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
    addPricingGroup: (state, action) => {
      const newGroup = {
          ...action.payload,
          id: `group_${Date.now()}`,
          plans: JSON.parse(JSON.stringify(DEFAULT_PLANS_TEMPLATE))
      };
      state.pricingGroups.push(newGroup);
    },
    updatePricingGroup: (state, action) => {
      const index = state.pricingGroups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.pricingGroups[index] = { ...state.pricingGroups[index], ...action.payload };
      }
    },
    deletePricingGroup: (state, action) => {
      state.pricingGroups = state.pricingGroups.filter(g => g.id !== action.payload);
    },
    updatePricingGroupPlans: (state, action) => {
        const { groupId, plans } = action.payload;
        const group = state.pricingGroups.find(g => g.id === groupId);
        if (group) {
            group.plans = plans;
        }
    }
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

export const { 
    setGalleryTagline, 
    setEditingPricingGroup, 
    addPricingGroup, 
    updatePricingGroup, 
    deletePricingGroup,
    updatePricingGroupPlans
} = adminSettingsSlice.actions;

export const selectPricingGroups = (state) => state.adminSettings.pricingGroups;
export const selectEditingPricingGroup = (state) => state.adminSettings.editingPricingGroup;

export default adminSettingsSlice.reducer;
