import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth, storage } from '../../firebase/app';
import { fetchUsers } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';
import { setUserType } from '../../analytics/utils';
import { fetchStudioByDomain } from '../../firebase/functions/studios';
import { getCurrentSubscription, getStudioSubscriptions } from '../../firebase/functions/subscription';

const initialState = {
  data: {
    usage: {
      storage: {
        quota: 0,
        used: 0,
      },
    },
  },
  currentSubscription: {
    id: null,
    plan: {
      planId: null,
      name: null,
      type: null,
    },
    billing: {
      billingCycle: null,
      autoRenew: false,
      paymentRecived:false,
      paymentPlatform: null,
      paymentMethod: null,
    },
    dates: {
      startDate: null,
      endDate: null,
      trialEndDate: null,
    },
    pricing: {
      basePrice: 0,
      discount: 0,
      tax: 0,
      currency: null,
      totalPrice: 0,
    },
    status: null,
    credit: 0,
    metadata: {
      createdAt: null,
      updatedAt: null,
      createdBy: null,
      updatedBy: null,
    },
  },
  subscriptions: [],
  loading: false,
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
      });
  }
});

export const { } = studioSlice.actions;
export default studioSlice.reducer;

export const selectStudio = (state) => state.studio.data;
export const selectCurrentSubscription = (state) => state.studio.currentSubscription;
export const selectStudioStorageUsage = (state) => state.studio.data?.usage.storage;
export const selectStudioSubscriptions = (state) => state.studio.subscriptions;
