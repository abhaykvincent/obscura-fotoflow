// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    createProject: false,
    createCollection: false,
    shareGallery: false,
    confirmDeleteProject:false,
    addPayment:false

};

const modalSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state[action.payload] = true;
      console.log('openModal',action.payload)
    },
    closeModal: (state, action) => {
      state[action.payload] = false;
      console.log('closeModal',action.payload)
    }
  }
});

export const { openModal,closeModal } = modalSlice.actions;
export const selectModal = (state) => state.modal;
export default modalSlice.reducer;