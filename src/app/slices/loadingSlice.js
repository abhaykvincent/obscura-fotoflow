import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    show: true,
    context: 'Loading...',
};

const loadingSlice = createSlice({
    name: 'loading',
    initialState,
    reducers: {
        showLoading: (state, action) => {
            state.show = true;
            if (action.payload) {
                state.context = action.payload;
            }
        },
        hideLoading: (state) => {
            state.show = false;
            state.context = 'Loading...';
        },
        setLoadingContext: (state, action) => {
            state.context = action.payload;
        },
    },
});

export const { showLoading, hideLoading, setLoadingContext } = loadingSlice.actions;

export default loadingSlice.reducer;
