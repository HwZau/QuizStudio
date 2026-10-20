import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const login = createAsyncThunk('auth/login', async (credentials) => {
  const result = await api('/auth/login', { method: 'POST', body: credentials });
  localStorage.setItem('quizToken', result.token);
  return result;
});

export const register = createAsyncThunk('auth/register', async (credentials) => {
  const result = await api('/auth/register', { method: 'POST', body: credentials });
  localStorage.setItem('quizToken', result.token);
  return result;
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (token) => {
  return api('/auth/me', { token });
});

const storedToken = localStorage.getItem('quizToken');
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: storedToken,
    user: null,
    status: storedToken ? 'checking' : 'idle',
    error: null,
    initialized: !storedToken
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      state.initialized = true;
    },
    clearAuthError(state) { state.error = null; }
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle'; state.initialized = true;
        state.token = action.payload.token; state.user = action.payload.user;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'idle'; state.initialized = true;
        state.token = action.payload.token; state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'idle'; state.error = action.error.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'idle'; state.error = action.error.message;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload; state.status = 'idle'; state.initialized = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        localStorage.removeItem('quizToken');
        state.token = null; state.user = null;
        state.status = 'idle'; state.initialized = true;
      });
  }
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
