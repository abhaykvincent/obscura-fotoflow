// slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	message: '',
	show: false,
  	type: '',
	id: '',
};

const alertSlice = createSlice({
	name: 'alert',
	initialState,
	reducers: {
		showAlert: (state, action) => {
			state.show = true;
			state.id = Date.now();
			state.type = action.payload.type;
			state.message = action.payload.message;
		},
		hideAlert: (state, action) => {
			state.show = false;
			state.type = '';
			state.message = '';
			state.id = '';
		}
	},
});

export const {showAlert, hideAlert, } = alertSlice.actions;
export default alertSlice.reducer;

export const selectAlertShow = (state) => state.alert.show;
export const selectAlertId = (state) => state.alert.id;
export const selectAlertType = (state) => state.alert.type;
export const selectAlertMessage = (state) => state.alert.message;
