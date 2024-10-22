// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    createProject: false,
    createCollection: false,
    shareGallery: false,
    confirmDeleteProject:false,
    confirmDeleteCollection:false,
    addPayment:false,
    addExpense:false,
    addBudget: false,
    loginEmailPassword: false,
};

const modalSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state[action.payload] = true;
      console.log('Opening '+action.payload +' Modal ...')
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
    },
    closeModal: (state, action) => {
      state[action.payload] = false;
      console.log('Closing '+action.payload +' Modal ...')
      document.body.style.overflow = 'auto';

    }
  }
});

export const { openModal,closeModal } = modalSlice.actions;
export const selectModal = (state) => state.modal;
export default modalSlice.reducer;