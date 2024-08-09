// src/redux/shortcutsSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shortcuts: {
    openProjects: 'p',
  },
};

const shortcutsSlice = createSlice({
  name: 'shortcuts',
  initialState,
  reducers: {
    updateShortcut: (state, action) => {
      const { key, newShortcut } = action.payload;
      state.shortcuts[key] = newShortcut;
    },
  },
});

export const { updateShortcut } = shortcutsSlice.actions;

export default shortcutsSlice.reducer;
