// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess, getStudiosOfUser } from '../../data/teams';

const initialState = {
  isAuthenticated: false,
  user: {
    displayName: '',
    email: '',
  },
  userStudio:{
    domain:'',
    name:''
  },
  loading: false,
  error: null,
};
export const login =  createAsyncThunk(
  'projects/login',
  async ({ email }, { dispatch }) => {
    console.log(getStudiosOfUser(email))
    if(getStudiosOfUser(email).domain!=undefined)
    {
      console.log('Opening Studio '+ getStudiosOfUser(email).name)
    }
    else{
      console.log('need account...')

    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state, action) => {
      state.isAuthenticated = false;
      localStorage.removeItem('authenticated')
      },
    loginEmailPassword: (state, action) => {
      console.log(action.payload)

		if (action.payload.userId === 'guest' && action.payload.password.includes('2024')) {
          console.log('Email & Password Authenticated')
          state.isAuthenticated = true;
          localStorage.setItem('authenticated', 'true')
			    state.user = action.payload;
          }
    },
    checkAuthStatus: (state, action) => {
		const isLocalAuthenticated = localStorage.getItem('authenticated');
		if (isLocalAuthenticated === 'true') {
			state.isAuthenticated = true;
		}
		else{
			state.isAuthenticated = false;
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
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch projects
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log(action.payload)
        if(getStudiosOfUser(action.payload.email)){
          console.log(getStudiosOfUser(action.payload.email))
          state.userStudio= {...getStudiosOfUser(action.payload.email)}
        }
        if (fullAccess(action.payload.email)) {  
          state.isAuthenticated = true;
          localStorage.setItem('authenticated', 'true')
          state.user = action.payload;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
    }
});

export const { logout, loginEmailPassword, checkAuthStatus, setUser, setLoading, setError, resetAuth } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectUserStudio = (state) => state.auth.userStudio;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;