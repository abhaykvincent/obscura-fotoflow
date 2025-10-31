import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import projectsReducer from './slices/projectsSlice'
import modalReducer from './slices/modalSlice'
import uploadReducer from './slices/uploadSlice'
import studioReducer from './slices/studioSlice'
import teamsReducer from './slices/teamsSlice'
import shortcutsReducer from './slices/shortcutSlice'
import searchReducer from './slices/searchSlice'
import referralsReducer from './slices/referralsSlice'
import notificationReducer from './slices/notificationSlice';
import adminPaneReducer from './slices/adminPaneSlice';
import packagesReducer from './slices/packagesSlice';
import smartGalleryReducer from './slices/smartGallerySlice';
import galleryReducer from './slices/gallerySlice';
import onboardingReducer from '../features/Onboarding/v2/slices/onboardingSlice';
import loadingReducer from './slices/loadingSlice';
import adminSettingsReducer from './slices/adminSettingsSlice';

export const store = configureStore({
  reducer: {
    gallery: galleryReducer,
    smartGallery: smartGalleryReducer,
    auth: authReducer,
    alert: alertReducer,
    projects: projectsReducer,
    search: searchReducer,
    modal: modalReducer,
    upload: uploadReducer,
    studio: studioReducer,
    referrals: referralsReducer,
    teams: teamsReducer,
    shortcuts: shortcutsReducer,
    notifications: notificationReducer,
    adminPane: adminPaneReducer,
    packages: packagesReducer,
    onboarding: onboardingReducer,
    loading: loadingReducer,
    adminSettings: adminSettingsReducer,
  },
});
