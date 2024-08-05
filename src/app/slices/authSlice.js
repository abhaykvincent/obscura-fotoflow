import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess, getStudiosOfUser, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth } from '../../firebase/app';

const initialState = {
  user: {
    email: '',
    access: [] // Array of studio names the user has access to
  },
  currentStudio: {
    name: '',
    domain:''
  },
  isAuthenticated: false,
  createStudio: false,
  loading: false,
  error: null,
};


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state,action) => {
      if (fullAccess(action.payload.email)) {  
        state.isAuthenticated = true;
        localStorage.setItem('authenticated', 'true')
        state.user = action.payload;
        console.log(action.payload)

        state.currentStudio = action.payload.studio
          

      }
      else{
        state.createStudio=true
        console.log("creating new studio")
         return('llll')
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      localStorage.removeItem('authenticated');
      state.user = { email: '', access: [] };
      state.currentStudio = { name: '', data: {} };
    },
    loginEmailPassword: (state, action) => {
      if (action.payload.userId === 'guest' && action.payload.password.includes('2024')) {
        state.isAuthenticated = true;
        localStorage.setItem('authenticated', 'true');
        state.user = action.payload;
      }
    },
    checkAuthStatus: (state) => {
      const isLocalAuthenticated = localStorage.getItem('authenticated');
      state.isAuthenticated = isLocalAuthenticated === 'true';
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setCurrentStudio: (state, action) => {
      state.currentStudio = action.payload;
    },
    resetAuth: () => initialState,
  }
});

export const { logout, loginEmailPassword, login, checkAuthStatus, setUser, setLoading, setError, resetAuth, setCurrentStudio } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectUserStudio = (state) => state.auth.currentStudio;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectCreateStudioModal = (state) => state.auth.createStudio
