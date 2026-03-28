import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../../types';
import { authService } from '../../services/auth.service';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  loading: false,
  error: null,
};

export const fetchSession = createAsyncThunk('auth/fetchSession', async () => {
  const response = await authService.getSession();
  return response.data;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  localStorage.removeItem('auth_token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem('auth_token', action.payload);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('auth_token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        const token =
          action.payload.token ??
          state.token ??
          localStorage.getItem('auth_token');

        state.token = token;
        if (token) {
          localStorage.setItem('auth_token', token);
        }
      })
      .addCase(fetchSession.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('auth_token');
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { setToken, setUser, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
