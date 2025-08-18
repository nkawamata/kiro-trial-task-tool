import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@task-manager/shared';
import { userService } from '../../services/userService';

interface UsersState {
  searchResults: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  searchResults: [],
  loading: false,
  error: null,
};

// Async thunks
export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query: string) => {
    const users = await userService.searchUsers(query);
    return users;
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search users';
      });
  },
});

export const { clearError, clearSearchResults } = usersSlice.actions;
export default usersSlice.reducer;