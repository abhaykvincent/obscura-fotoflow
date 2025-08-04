import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addPackageToFirestore } from '../../firebase/functions/packages-firestore';

export const addPackage = createAsyncThunk(
  'packages/addPackage',
  async ({ domain, packageData }, { rejectWithValue }) => {
    try {
      const newPackage = await addPackageToFirestore(domain, packageData);
      return newPackage;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const packagesSlice = createSlice({
  name: 'packages',
  initialState: {
    packages: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addPackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.packages.push(action.payload);
      })
      .addCase(addPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectPackages = (state) => state.packages.packages;
export const selectPackagesLoading = (state) => state.packages.loading;
export const selectPackagesError = (state) => state.packages.error;

export default packagesSlice.reducer;