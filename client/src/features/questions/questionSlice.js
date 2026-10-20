import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const fetchQuestions = createAsyncThunk('questions/fetchAll', async (_, { getState }) =>
  api('/questions', { token: getState().auth.token }));
export const saveQuestion = createAsyncThunk('questions/save', async ({ id, ...body }, { getState }) =>
  api(id ? '/questions/' + id : '/questions', {
    method: id ? 'PUT' : 'POST', token: getState().auth.token, body
  }));
export const deleteQuestion = createAsyncThunk('questions/delete', async (id, { getState }) => {
  await api('/questions/' + id, { method: 'DELETE', token: getState().auth.token });
  return id;
});

const initialState = { list: [], status: 'idle', busy: false, error: null };
const slice = createSlice({
  name: 'questions', initialState,
  reducers: { clearQuestionError(state) { state.error = null; } },
  extraReducers(builder) {
    builder
      .addCase(fetchQuestions.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchQuestions.fulfilled, (state, action) => { state.status = 'ready'; state.list = action.payload; })
      .addCase(fetchQuestions.rejected, (state, action) => { state.status = 'error'; state.error = action.error.message; })
      .addCase(saveQuestion.pending, (state) => { state.busy = true; state.error = null; })
      .addCase(saveQuestion.fulfilled, (state, action) => {
        state.busy = false;
        const index = state.list.findIndex((item) => item._id === action.payload._id);
        if (index < 0) state.list.push(action.payload);
        else state.list[index] = action.payload;
      })
      .addCase(saveQuestion.rejected, (state, action) => { state.busy = false; state.error = action.error.message; })
      .addCase(deleteQuestion.pending, (state) => { state.busy = true; state.error = null; })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.busy = false; state.list = state.list.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteQuestion.rejected, (state, action) => { state.busy = false; state.error = action.error.message; })
      .addCase('auth/logout', () => initialState);
  }
});
export const { clearQuestionError } = slice.actions;
export default slice.reducer;
