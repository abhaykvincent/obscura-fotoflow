// slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	show: false,
  	type: '',
  	message: '',
};

const alertSlice = createSlice({
	name: 'alert',
	initialState,
	reducers: {
		showAlert: (state, action) => {
			state.show = true;
			state.type = action.payload.type;
			state.message = action.payload.message;
		},
		hideAlert: (state, action) => {
			state.show = false;
			state.type = '';
			state.message = '';
		}
	},
});

export const {showAlert, hideAlert, } = alertSlice.actions;
export default alertSlice.reducer;

export const selectAlertShow = (state) => state.alert.show;
export const selectAlertType = (state) => state.alert.type;
export const selectAlertMessage = (state) => state.alert.message;
