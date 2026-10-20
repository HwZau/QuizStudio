import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const fetchArticles = createAsyncThunk('articles/fetch', async (_, { getState }) =>
  api('/articles', { token: getState().auth.token }));
export const saveArticle = createAsyncThunk('articles/save', async ({ id, ...body }, { getState }) =>
  api(id ? '/articles/' + id : '/articles', {
    method: id ? 'PUT' : 'POST', body, token: getState().auth.token
  }));
export const deleteArticle = createAsyncThunk('articles/delete', async (id, { getState }) => {
  await api('/articles/' + id, { method: 'DELETE', token: getState().auth.token });
  return id;
});

const initialState = { list: [], status: 'idle', busy: false, error: null };
const slice = createSlice({
  name: 'articles', initialState,
  reducers: { clearArticleError(state) { state.error = null; } },
  extraReducers(builder) {
    builder
      .addCase(fetchArticles.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchArticles.fulfilled, (state, action) => { state.status = 'ready'; state.list = action.payload; })
      .addCase(fetchArticles.rejected, (state, action) => { state.status = 'error'; state.error = action.error.message; })
      .addCase(saveArticle.pending, (state) => { state.busy = true; state.error = null; })
      .addCase(saveArticle.fulfilled, (state, action) => {
        state.busy = false;
        const index = state.list.findIndex((item) => item._id === action.payload._id);
        if (index < 0) state.list.push(action.payload);
        else state.list[index] = action.payload;
      })
      .addCase(saveArticle.rejected, (state, action) => { state.busy = false; state.error = action.error.message; })
      .addCase(deleteArticle.pending, (state) => { state.busy = true; state.error = null; })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.busy = false; state.list = state.list.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteArticle.rejected, (state, action) => { state.busy = false; state.error = action.error.message; })
      .addCase('auth/logout', () => initialState);
  }
});
export const { clearArticleError } = slice.actions;
export default slice.reducer;
