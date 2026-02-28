import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getUsedSpace } from '../../utils/fileUtils';
import { fullAccess, getStudiosOfUser, isAlreadyInStudio, users } from '../../data/teams';
import firebase from 'firebase/app';
import { auth } from '../../firebase/app';
import { fetchUsers } from '../../firebase/functions/firestore';
import { useRevalidator } from 'react-router';
import { setUserType } from '../../analytics/utils';
import { updateStudioLogoAsync } from './adminSettingsSlice';

const initialState = {
  user: {
    name:'',
    email: '',
    image: '',
    access: [] // Array of studio names the user has access to
  },
  currentStudio: {
    name: 'Guest 2024',
    domain:'guest',
    studioLogo:''
  },
  limits:{
    storage: {
      // In MB 
      // 1 GB - 1000
      total: 5000,
      available:20000
    },
    projects:{

    },
    collections:{
      perProject: 3
    }
  },
  isAuthenticated: false,
  createStudio: false,
  loading: true,
  error: null,
};

export const verifyAuth = createAsyncThunk(
  'auth/verifyAuth',
  async () => {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          const users = await fetchUsers();
          const appUser = users.find(u => u.email === firebaseUser.email);
          if (appUser) {
            localStorage.setItem('authenticated', 'true');
            localStorage.setItem('user', JSON.stringify(appUser));
            
            const userStudio = appUser.studios?.[0] || appUser.studio;
            if (userStudio) {
              localStorage.setItem('studio', JSON.stringify(userStudio));
            }
            resolve({ isAuthenticated: true, user: appUser, studio: userStudio });
          } else {
            localStorage.removeItem('authenticated');
            localStorage.removeItem('user');
            localStorage.removeItem('studio');
            resolve({ isAuthenticated: false, user: null, studio: null });
          }
        } else {
          localStorage.removeItem('authenticated');
          localStorage.removeItem('user');
          localStorage.removeItem('studio');
          resolve({ isAuthenticated: false, user: null, studio: null });
        }
      });
    });
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await auth.signOut();
    localStorage.removeItem('authenticated');
    localStorage.removeItem('studio');
    localStorage.removeItem('user');
  }
);

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
      const user = users.find(u => u.email === serializedUser.email);

      if (user) {
        const userStudio = serializedUser.selectedStudio || user.studios?.[0] || user.studio;
        
        color= '#54a134'
        console.log(`%cUser found in ${userStudio?.name || 'no studio'} `, `color: ${color}; font-size: ${fontSize}`);

        localStorage.setItem('authenticated', 'true');
        if(userStudio){
          localStorage.setItem('studio', JSON.stringify(userStudio));
          // store user
          localStorage.setItem('user', JSON.stringify(user));
          return {
            ...user,
            selectedStudio: userStudio
          }
        }
      } 
      
      if(serializedUser.email){
        color= '#54a134'
        console.log(`%c${serializedUser.email} Authenticated as  ${serializedUser.displayName}`, `color: ${color}; font-size: ${fontSize}`);
        localStorage.setItem('authenticated', 'true');

        // store user
        localStorage.setItem('user', JSON.stringify(user || serializedUser));
          
        return user || serializedUser;
      }
      
      
    } catch (error) {
      return 'no-studio-found'

    }
  })

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginEmailPassword: (state, action) => {
      if (action.payload.userId === 'guest' && action.payload.password.includes('2024')) {
        state.isAuthenticated = true;
        localStorage.setItem('authenticated', 'true');
        state.user = action.payload;
      }
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
      localStorage.setItem('studio',JSON.stringify(action.payload))
    },
    setStudioLogo: (state, action) => {
      if (state.currentStudio) {
        state.currentStudio.studioLogo = action.payload;
        localStorage.setItem('studio', JSON.stringify(state.currentStudio));
      }
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
        state.user = { ...state.user, ...action.payload, name: action.payload.displayName, image: action.payload.photoURL };
        if(action.payload !== 'no-studio-found') {
          state.currentStudio = action.payload.selectedStudio || action.payload.studios?.[0] || action.payload.studio || initialState.currentStudio;
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
      })
      .addCase(verifyAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyAuth.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.currentStudio = action.payload.studio || initialState.currentStudio;
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyAuth.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.currentStudio = initialState.currentStudio;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = { email: '', access: [] };
        state.currentStudio = { name: '', domain: '' };
        console.log('%cLogged out...', 'color: orange; font-size: 0.9rem;');
      })
      .addCase(updateStudioLogoAsync.fulfilled, (state, action) => {
        if (state.currentStudio) {
          state.currentStudio.studioLogo = action.payload;
          localStorage.setItem('studio', JSON.stringify(state.currentStudio));
        }
      });
  }
});

export const { loginEmailPassword, setAvailableStortage, setUser, setLoading, setError, resetAuth, setCurrentStudio, setStudioLogo } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectUserStudio = (state) => state.auth.currentStudio;
export const selectDomain = (state) => state.auth.currentStudio.domain;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectCreateStudioModal = (state) => state.auth.createStudio
export const selectCollectionsLimit = (state) => state.auth.limits.collections;