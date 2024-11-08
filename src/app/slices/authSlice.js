import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth } from '../../firebase/app';
import { fetchUsers } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';

const initialState = {
  user: {
    name:'',
    email: '',
    access: [] // Array of studio names the user has access to
  },
  currentStudio: {
    name: 'Guest 2024',
    domain:'guest'
  },
  limits:{
    storage: {
      // In MB 
      // 1 GB - 1000
      total: 5000,
      available:2000
    },
    projects:{

    },
    collections:{
      perProject: 3
    }
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
      
    let color = 'orange';
    const fontSize ='0.8rem';
    console.log(`%cLogging in as ${serializedUser.email}`, `color: ${color}; font-size: ${fontSize}`);
    
      // store user
      localStorage.setItem('user', JSON.stringify(serializedUser));
      const users = await fetchUsers()
      const user = users.find(user => {
      if(user.email === serializedUser.email){
        return user
        }
      })
      color= '#54a134'
      console.log(`%cUser found in ${user.studio.name} `, `color: ${color}; font-size: ${fontSize}`);

      if (user) {
        localStorage.setItem('authenticated', 'true');
        if(user.studio){
          localStorage.setItem('studio', JSON.stringify(user.studio));
          // store user
          localStorage.setItem('user', JSON.stringify(user));
          return {
            ...user
          }
        }
      } 
      if(user.email){
        color= '#54a134'
        console.log(`%c${serializedUser.email} Authenticated as  ${serializedUser.displayName}`, `color: ${color}; font-size: ${fontSize}`);
        localStorage.setItem('authenticated', 'true');

          // store user
          localStorage.setItem('user', JSON.stringify(user));
          
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
      localStorage.removeItem('user')
      console.log('%cLogged out...', 'color: orange; font-size: 0.9rem;');
      state.user = { email: '', access: [] };
      state.currentStudio = { name: '', domain: '' }; 
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
      if(state.isAuthenticated) {
      {
        let color= '#54a134'
        console.log(`%cAuthenticated`, `color: ${color}; font-size: 0.8rem`);
        state.user = JSON.parse(localStorage.getItem('user'));
      }
      }
    },
    checkStudioStatus: (state) => {
      const studioLocal = localStorage.getItem('studio');
      state.currentStudio = JSON.parse(studioLocal);
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
      localStorage.setItem('studio',JSON.parse(action.payload))
    },
    setAvailableStortage: (state, action) => {
      const available = state.limits.storage.total-getUsedSpace(action.payload)
      state.limits.storage.available=available
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
        if(action.payload !== 'no-studio-found') {
          state.currentStudio = action.payload.studio;
        }
        else{
          // get user from local storage 
          let userFromLocalStorage = JSON.parse(localStorage.getItem('user'));
          state.user = userFromLocalStorage;
          
        }
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, loginEmailPassword, checkAuthStatus,checkStudioStatus, setAvailableStortage, setUser, setLoading, setError, resetAuth, setCurrentStudio } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectUserStudio = (state) => state.auth.currentStudio;
export const selectDomain = (state) => state.auth.currentStudio.domain;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectCreateStudioModal = (state) => state.auth.createStudio
export const selectStorageLimit = (state) => state.auth.limits.storage;
export const selectCollectionsLimit = (state) => state.auth.limits.collections;
