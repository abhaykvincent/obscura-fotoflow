import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth } from '../../firebase/app';
import { fetchUsers } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';

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

export const login = createAsyncThunk(
  'user/login',
  async (serializedUser, { rejectWithValue }) => {
    try {
      // Perform the login logic here (e.g., API call, validation, etc.)
      // For example, assume fullAccess is an async function that checks user access
      
      const users = await fetchUsers()
      // find user in users with email
      // if user exists, return user
      console.log(users)
      const user = users.find(user => {
         if(user.id === serializedUser.email){
          return serializedUser
        }} 
      )
      console.log(user)

      if (user) {
        localStorage.setItem('authenticated', 'true');
        console.log(user)
        if(user.studio){
          localStorage.setItem('studio', JSON.stringify(user.studio));
          console.log('Studio - storing studio to local storage...')
          debugger
          console.log('studio-found')
          return {
            studio: user.studio,
          }
        }
      } 
      if(user.email){
        console.log('user authenticated')
        localStorage.setItem('authenticated', 'true');
        return user
      }
      
      
    } catch (error) {
      return 'no-studio-found'

    }
  })

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    
    logout: (state) => {
      state.isAuthenticated = false;
      localStorage.removeItem('authenticated');
      localStorage.removeItem('studio');
      console.log('Logging out...')
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
    checkStudioStatus: (state) => {
      const studioLocal = localStorage.getItem('studio');
      console.log(studioLocal)
      state.currentStudio = studioLocal ? JSON.parse(studioLocal) : {};
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
      localStorage.setItem('studio',action.payload)
      console.log(action.payload)
      debugger
    },
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.currentStudio = action.payload.studio;
        console.log(action.payload)
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, loginEmailPassword, checkAuthStatus,checkStudioStatus, setUser, setLoading, setError, resetAuth, setCurrentStudio } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectUserStudio = (state) => state.auth.currentStudio;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectCreateStudioModal = (state) => state.auth.createStudio
