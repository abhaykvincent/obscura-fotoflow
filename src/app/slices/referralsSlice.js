import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth, storage } from '../../firebase/app';
import { fetchAllReferalsFromFirestore, fetchStudioByDomain, fetchUsers, generateReferralInFirebase } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';
import { setUserType } from '../../analytics/utils';

const initialState = {
  data:{
    referrals:[
    {
      campainName:"test",
      campainPlatform: "",
      type: "",
      email: "",
      code: [],
      status: "active",
      quota: 3,
      used: 0,
      validity: 30,
      createdAt:new Date().toISOString(),
    }
    ]
  }
};
export const fetchReferrals = createAsyncThunk(
  'referrals/fetchReferrals',
  async ({ }) => {
    try {
      const referallsData = await fetchAllReferalsFromFirestore()
      console.log(referallsData)
      return referallsData;
    } catch (error) {
      throw error;
    }
  }
);


export const generateReferral = createAsyncThunk(
  'referrals/generateReferral',
  async (referralData) => {
    try {
      const referral = await generateReferralInFirebase(referralData)
      return referral;
    } catch (error) {
      throw error;
    }
  }
);

const referralsSlice = createSlice({
  name: 'referrals',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferrals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReferrals.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload)
        state.data.referrals.push(action.payload);

        state.error = null;
      })
      .addCase(fetchReferrals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

      builder
      .addCase(generateReferral.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateReferral.fulfilled, (state, action) => {
        state.loading = false;
        state.data.referrals= [action.payload];
        state.error = null;
      })
      .addCase(generateReferral.rejected, (state,
        action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { } = referralsSlice.actions;
export default referralsSlice.reducer;

export const selectReferrals = (state) =>  state.referrals.data.referrals;
