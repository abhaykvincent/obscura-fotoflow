// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess } from '../../data/teams';
import { addCollectionToFirestore, addCrewToFirestore, addEventToFirestore, addProjectToFirestore, deleteCollectionFromFirestore, deleteProjectFromFirestore, fetchProjectsFromFirestore } from '../../firebase/functions/firestore';
import { showAlert } from './alertSlice';


const initialState = {
    createProject: false,
    createCollection: false,
    shareGallery: false,
    confirmDeleteProject:false

};

const modalSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state[action.payload] = true;
    },
    closeModal: (state, action) => {
      state[action.payload] = false;
    }
  }
});

export const { openModal,closeModal } = modalSlice.actions;
export const selectModal = (state) => state.modal;
export default modalSlice.reducer;