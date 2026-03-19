import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth } from '../../firebase/app';
import { fetchUsers } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';
import { setUserType } from '../../analytics/utils';
import { fetchStudioByDomain } from '../../firebase/functions/studios';
import { getCurrentSubscription, getStudioInvoices, getStudioSubscriptions } from '../../firebase/functions/subscription';
import { updateStudioLogoAsync, updateStudioAsync } from './adminSettingsSlice';

const initialState = {
  data: {
    id: null,
    name: null,
    domain: null,
    ownerId: null,
    bucketUrl: null,
    userBatch: null,
    planName: null,
    status: null,
    batch: null,
    usage: {
      storage: {
        quota: 0,
        used: 0,
      },
      projects: {
        monthlyQuota: 0,
        monthlyUsed: 0,
      },
      collections: {
        quota: 0,
      }
    },
    billing: {
      razorpayCustomerId: null,
      razorpaySubscriptionId: null,
      planId: null,
      status: null,
      currentPeriodEnd: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
      quantity: 1,
      subscriptionHistory: [],
    },
    subscriptionId: null,
    metadata: {
      createdAt: null,
      updatedAt: null,
      createdBy: null,
      updatedBy: null,
      version: 2
    },
    trialEndDate: null,
  },
  currentSubscription: {
    id: null,
    studioId: null,
    plan: {
      planId: null,
      name: null,
      type: null,
    },
    billing: {
      billingCycle: null,
      autoRenew: false,
      paymentRecived: false,
      paymentPlatform: null,
      paymentMethod: null,
    },
    dates: {
      startDate: null,
      endDate: null,
    },
    pricing: {
      basePrice: 0,
      discount: 0,
      tax: 0,
      currency: null,
      totalPrice: 0,
    },
    status: null,
    metadata: {
      createdAt: null,
      updatedAt: null,
      createdBy: null,
      updatedBy: null,
    },
    invoiceId: null,
    invoiceHistory: [],
  },
  subscriptions: [],
  invoices: [],
  loading: false,
  galleryStudio: null,
  galleryLoading: false,
  error: null,
};
export const fetchStudio = createAsyncThunk(
  'studio/fetchStudio',
  async ({ currentDomain}) => {
    try {
        const studio = await fetchStudioByDomain(currentDomain);
        return studio;
    } catch (error) {
      throw error;
    }
  }
);
export const fetchGalleryStudio = createAsyncThunk(
  'studio/fetchGalleryStudio',
  async ({ currentDomain }) => {
    try {
      const studio = await fetchStudioByDomain(currentDomain);
      return studio;
    } catch (error) {
      throw error;
    }
  }
);
export const fetchCurrentSubscription = createAsyncThunk(
  'studio/fetchCurrentSubscription',
  async ({ currentDomain }, { rejectWithValue }) => {
    try {
      const subscription = await getCurrentSubscription(currentDomain)
      return subscription;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const fetchStudioSubscriptions = createAsyncThunk(
  'studio/fetchStudioSubscriptions',
  async ({ studioId }, { rejectWithValue }) => {
    try {

      const result = await getStudioSubscriptions(studioId);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const fetchStudioInvoices = createAsyncThunk(
  'studio/fetchStudioInvoices',
  async ({ studioId }, { rejectWithValue }) => {
    try {
      const result = await getStudioInvoices(studioId);
      if (!result.success) {
        throw new Error(result.message);
      }
      console.log(result.data);
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudio.fulfilled, (state, action) => {
        state.loading = false;
        state.data= action.payload;
        state.error = null;
      })
      .addCase(fetchStudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // New fetchGalleryStudio cases
      .addCase(fetchGalleryStudio.pending, (state) => {
        state.galleryLoading = true;
        state.error = null;
      })
      .addCase(fetchGalleryStudio.fulfilled, (state, action) => {
        state.galleryLoading = false;
        state.galleryStudio = action.payload;
        state.error = null;
      })
      .addCase(fetchGalleryStudio.rejected, (state, action) => {
        state.galleryLoading = false;
        state.error = action.payload;
      })

      // Update Studio Logo (from adminSettingsSlice)
      .addCase(updateStudioLogoAsync.fulfilled, (state, action) => {
        if (state.data) {
          state.data.studioLogo = action.payload;
        }
      })

      // Update Studio (from adminSettingsSlice)
      .addCase(updateStudioAsync.fulfilled, (state, action) => {
        if (state.data) {
            Object.keys(action.payload).forEach(key => {
                if (key.includes('.')) {
                    const parts = key.split('.');
                    let current = state.data;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) current[parts[i]] = {};
                        current = current[parts[i]];
                    }
                    current[parts[parts.length - 1]] = action.payload[key];
                } else {
                    state.data[key] = action.payload[key];
                }
            });
        }
      })

      // New fetchCurrentSubscription cases
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubscription = action.payload.data;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // New fetchStudioSubscriptions cases
      .addCase(fetchStudioSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudioSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload; // Store the fetched subscriptions
        state.error = null;
      })
      .addCase(fetchStudioSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // New fetchStudioInvoices cases
      .addCase(fetchStudioInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudioInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload; // Store the fetched subscriptions
        state.error = null;
      })
      .addCase(fetchStudioInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { } = studioSlice.actions;
export default studioSlice.reducer;

export const selectStudio = (state) => state.studio.data;
export const selectGalleryStudio = (state) => state.studio.galleryStudio;
export const selectGalleryStudioLoading = (state) => state.studio.galleryLoading;
export const selectCurrentSubscription = (state) => state.studio.currentSubscription;
export const selectStudioStorageUsage = (state) => state.studio.data?.usage?.storage;
export const selectStudioSubscriptions = (state) => state.studio.subscriptions;
export const selectStudioInvoices = (state) => state.studio.invoices;
