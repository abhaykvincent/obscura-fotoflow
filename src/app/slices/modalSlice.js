// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    createProject: false,
    createCollection: false,
    shareGallery: false,
    confirmDeleteProject:false,
    addPayment:false,
    addBudget: false

};

const modalSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state[action.payload] = true;
      console.log('Opening '+action.payload +' Modal ...')
    },
    closeModal: (state, action) => {
      state[action.payload] = false;
    }
  }
});

export const { openModal,closeModal } = modalSlice.actions;
export const selectModal = (state) => state.modal;
export default modalSlice.reducer;