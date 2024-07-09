import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import projectsReducer from './slices/projectsSlice'
import modalReducer from './slices/modalSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alert: alertReducer,
    projects: projectsReducer,
    modal: modalReducer,
  },
});
