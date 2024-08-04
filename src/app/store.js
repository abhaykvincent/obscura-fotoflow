import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import projectsReducer from './slices/projectsSlice'
import modalReducer from './slices/modalSlice'
import uploadReducer from './slices/uploadSlice'
import studioReducer from './slices/studioSlice'
import teamsReducer from './slices/teamsSlice'
import shortcutsReducer from './slices/shortcutSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alert: alertReducer,
    projects: projectsReducer,
    modal: modalReducer,
    upload: uploadReducer,
    studio: studioReducer,
    teams: teamsReducer,
    shortcuts: shortcutsReducer,
  },
});
