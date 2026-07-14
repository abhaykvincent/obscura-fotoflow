import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addBookingToFirestore, fetchBookingsFromFirestore } from '../../firebase/functions/booking-firestore';

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async ({ domain, bookingData }, { rejectWithValue }) => {
    try {
      const response = await addBookingToFirestore(domain, bookingData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (domain, { rejectWithValue }) => {
    try {
      const bookings = await fetchBookingsFromFirestore(domain);
      return bookings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  bookings: [],
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.push(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBookingError } = bookingSlice.actions;

export const selectBookings = (state) => state.booking.bookings;
export const selectBookingLoading = (state) => state.booking.loading;
export const selectBookingError = (state) => state.booking.error;

export default bookingSlice.reducer;
