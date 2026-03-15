import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createExtensionRequest } from '../../firebase/functions/studios';

export const requestExtension = createAsyncThunk(
  'extensionRequest/request',
  async ({ domain, projectId, projectName }) => {
    const response = await createExtensionRequest(domain, projectId, projectName);
    return response;
  }
);

const extensionRequestSlice = createSlice({
  name: 'extensionRequest',
  initialState: {
    loading: false,
    error: null,
    lastRequest: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(requestExtension.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestExtension.fulfilled, (state, action) => {
        state.loading = false;
        state.lastRequest = action.payload;
      })
      .addCase(requestExtension.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default extensionRequestSlice.reducer;
