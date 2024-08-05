// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess, teams as teamsData} from '../../data/teams';
import { addBudgetToFirestore, addCollectionToFirestore, addCrewToFirestore, addEventToFirestore, addExpenseToFirestore, addPaymentToFirestore, addProjectToStudio, deleteCollectionFromFirestore, deleteProjectFromFirestore, fetchProjectsFromFirestore } from '../../firebase/functions/firestore';
import { showAlert } from './alertSlice';

const initialState = {
  data: teamsData,
  status: 'idle',
  loading : false,
  error: null,
};
// teams
export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams', 
  console.log('fetchTeamsFromFirestore')
);

export const addAssociate = createAsyncThunk(
  'teams/addTeams',
  (associate) => console.log('addAssociateToFirestore(associate)')
);


export const deleteAssociate = createAsyncThunk(
  'teams/deleteAssociate',
  console.log('deleteAssociateFromFirestore')
);



const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setTeams_temp: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {

    // Fetch teams
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      
      // Add associate
      builder
      .addCase(addAssociate.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
     .addCase(addAssociate.fulfilled, (state, action) => {
        state.status = 'idle';
        state.loading = false;
        state.data.push(action.payload);
      })
     .addCase(addAssociate.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });

      // Delete associate
      builder
      .addCase(deleteAssociate.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(deleteAssociate.fulfilled, (state, action) => {
        state.status = 'idle';
        state.loading = false;
        state.data = state.data.filter(associate => associate.id !== action.payload);
      })
      .addCase(deleteAssociate.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setTeamss_temp } = teamsSlice.actions;
export default teamsSlice.reducer;

// Selector to get projects data from the state
export const selectTeams = (state) => state.teams.data;
export const selectLoading = (state) => state.teams.loading;

// Line Complexity  1.0 -> 
