import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelectionRequest, fetchSelectionRequests, approveSelectionRequest, declineSelectionRequest } from '../../firebase/functions/studios';

export const requestSelectionReset = createAsyncThunk(
  'selectionRequest/requestReset',
  async ({ domain, projectId, projectName }) => {
    const response = await createSelectionRequest(domain, projectId, projectName);
    return response;
  }
);

export const getSelectionRequests = createAsyncThunk(
  'selectionRequest/getRequests',
  async (domain) => {
    const response = await fetchSelectionRequests(domain);
    return response;
  }
);

export const acceptSelectionReset = createAsyncThunk(
  'selectionRequest/acceptReset',
  async ({ domain, projectId }) => {
    await approveSelectionRequest(domain, projectId);
    return projectId;
  }
);

export const declineSelectionReset = createAsyncThunk(
  'selectionRequest/declineReset',
  async ({ domain, projectId }) => {
    await declineSelectionRequest(domain, projectId);
    return projectId;
  }
);

const selectionRequestSlice = createSlice({
  name: 'selectionRequest',
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
      .addCase(getSelectionRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSelectionRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(getSelectionRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(acceptSelectionReset.fulfilled, (state, action) => {
        state.requests = state.requests.filter((req) => req.projectId !== action.payload);
      })
      .addCase(declineSelectionReset.fulfilled, (state, action) => {
        state.requests = state.requests.filter((req) => req.projectId !== action.payload);
      });
  },
});

export const { removeRequestLocally } = selectionRequestSlice.actions;
export const selectSelectionRequests = (state) => state.selectionRequest.requests.filter(req => req.status === 'pending');
export default selectionRequestSlice.reducer;
