import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    show: false,
    context: 'Loading...',
    subcontext:''
};

const loadingSlice = createSlice({
    name: 'loading',
    initialState,
    reducers: {
        showLoading: (state, action) => {
            state.show = true;
            if (action.payload) {
                console.log(action.payload)
                state.context = action.payload.context;
                state.subcontext = action.payload.subcontext;
            }
        },
        hideLoading: (state) => {
            state.show = false;
            state.context = 'Loading...';
            state.subcontext = '';
        },
        setLoadingContext: (state, action) => {
            state.context = action.payload.context;
            state.subcontext = action.payload.subcontext;
        },
    },
});

export const { showLoading, hideLoading, setLoadingContext } = loadingSlice.actions;

export default loadingSlice.reducer;
