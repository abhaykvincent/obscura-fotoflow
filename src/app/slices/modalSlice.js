// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {
    createProject: false,
    createPortfolio: false,
    createCollection: false,
    createEvent: false,
    shareGallery: false,
    confirmDeleteproject:false,
    confirmDeletecollection:false,
    addPayment:false,
    addExpense:false,
    addBudget: false,
    addReferral: false,
    loginEmailPassword: false,
    upgrade:false,
    trialStatus:false,
    qrCode:false,
    createPackage: false,
    welcome: false
};
export const closeModalWithAnimation = createAsyncThunk(
  'projects/closeModalWithAnimation',
  async (modalName, { dispatch }) => {
    const modalElements = document.querySelectorAll(`.modal-container`);
    const modalElement = modalElements[modalElements.length - 1];
    if (modalElement) {
      modalElement.classList.add('closingModal');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    dispatch(closeModal(modalName));
  }
);
const modalSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state[action.payload] = true;
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      //
    },
    closeModal: (state, action) => {
      state[action.payload] = false;
      document.body.style.overflow = 'auto';

    }
  }
});

export const { openModal,closeModal } = modalSlice.actions;
export const selectModal = (state) => state.modal;
export default modalSlice.reducer;