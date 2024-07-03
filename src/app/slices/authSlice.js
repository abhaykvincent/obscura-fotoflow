// slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fullAccess } from '../../data/teams';

const initialState = {
  isAuthenticated: false,
  user: {
	displayName: '',
	email: '',
  },
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state, action) => {
		state.isAuthenticated = false;
		localStorage.removeItem('authenticated')
    },
    login: (state, action) => {
		if (fullAccess(action.payload.email)) {  
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
});

export const { logout, login, checkAuthStatus, setUser, setLoading, setError, resetAuth } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;