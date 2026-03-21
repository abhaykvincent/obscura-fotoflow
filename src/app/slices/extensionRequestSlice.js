import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createExtensionRequest, fetchExtensionRequests, approveExtensionRequest, declineExtensionRequest } from '../../firebase/functions/studios';

export const requestExtension = createAsyncThunk(
  'extensionRequest/request',
  async ({ domain, projectId, projectName }) => {
    const response = await createExtensionRequest(domain, projectId, projectName);
    return response;
  }
);

export const getExtensionRequests = createAsyncThunk(
  'extensionRequest/getRequests',
  async (domain) => {
    const response = await fetchExtensionRequests(domain);
    return response;
  }
);

export const acceptExtension = createAsyncThunk(
  'extensionRequest/accept',
  async ({ domain, projectId }) => {
    await approveExtensionRequest(domain, projectId);
    return projectId;
  }
);

export const declineExtension = createAsyncThunk(
  'extensionRequest/decline',
  async ({ domain, projectId }) => {
    await declineExtensionRequest(domain, projectId);
    return projectId;
  }
);

const extensionRequestSlice = createSlice({
  name: 'extensionRequest',
  initialState: {
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {
    removeRequestLocally: (state, action) => {
        state.requests = state.requests.filter((req) => req.projectId !== action.payload);
      },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestExtension.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestExtension.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(requestExtension.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getExtensionRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getExtensionRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(getExtensionRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(acceptExtension.fulfilled, (state, action) => {
        state.requests = state.requests.filter((req) => req.projectId !== action.payload);
      })
      .addCase(declineExtension.fulfilled, (state, action) => {
        state.requests = state.requests.filter((req) => req.projectId !== action.payload);
      });
  },
});

export const { removeRequestLocally: removeExtensionRequestLocally } = extensionRequestSlice.actions;
export const selectExtensionRequests = (state) => state.extensionRequest.requests;
export default extensionRequestSlice.reducer;
