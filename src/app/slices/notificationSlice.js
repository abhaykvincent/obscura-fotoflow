import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
  fetchNotificationsFromFirestore,
  markNotificationReadInFirestore,
  deleteNotificationFromFirestore,
  createNotificationInFirestore
} from '../../firebase/functions/notifications';
import { auth } from '../../firebase/app';

const initialState = {
  data: {
    notifications: []
  },
  loading: false,
  error: null,
  unreadCount: 0
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (studioId) => {
      try {
        return await fetchNotificationsFromFirestore(studioId);
      } catch (error) {
        throw error;
      }
    }
  );
  // In your notifications slice file
export const createNotification = createAsyncThunk(
    'notifications/createNotification',
    async ({ studioId, notificationData }, { rejectWithValue }) => {
      try {
        const newNotification = await createNotificationInFirestore(
          studioId,
          notificationData
        );
        return newNotification;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );
  export const markNotificationRead = createAsyncThunk(
    'notifications/markNotificationRead',
    async ({ studioId, notificationId }) => {
      try {
        return await markNotificationReadInFirestore(studioId, notificationId);
      } catch (error) {
        throw error;
      }
    }
  );

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId) => {
    try {
      await deleteNotificationFromFirestore(notificationId);
      return notificationId;
    } catch (error) {
      throw error;
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.data.notifications = [];
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload)
        state.data.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create Notification
      .addCase(createNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        state.loading = false;
        // Add new notification to beginning of array (assuming chronological order)
        state.data.notifications.unshift(action.payload);
        // Increment unread count if notification is unread
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Notification Read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.data.notifications.find(
          n => n.id === action.payload
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.data.notifications = state.data.notifications.filter(
          n => n.id !== action.payload
        );
        state.unreadCount = state.data.notifications.filter(n => !n.isRead).length;
      });
  }
});

export const { clearNotifications } = notificationsSlice.actions;

export default notificationsSlice.reducer;

// Selectors
export const selectAllNotifications = (state) => 
  state.notifications.data.notifications;

export const selectUnreadNotifications = (state) =>
  state.notifications.data.notifications.filter(n => !n.isRead);

export const selectUnreadCount = (state) =>
  state.notifications.unreadCount;