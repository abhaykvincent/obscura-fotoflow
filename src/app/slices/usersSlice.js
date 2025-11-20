import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, db } from '../../firebase/app'; // Adjust this path if needed
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { generateRandomString } from '../../utils/stringUtils';

// Thunk to add a new user
export const addUser = createAsyncThunk(
  'users/addUser',
  async (userData, { rejectWithValue }) => {
    const { email,phone,  displayName, studioName, domain, role } = userData;
    try {
      // 2. Add user details to Firestore
      const uid= `${studioName.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`
      const userDocRef = doc(db, 'leads', uid)
      await setDoc(userDocRef, {
        uid: uid,
        displayName,
        email,
        phone,
        studio:{
          name:studioName,
          domain:domain,
        },
        role,
        createdAt: new Date().toISOString(),
      });

      return { uid:uid, ...userData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default usersSlice.reducer;
