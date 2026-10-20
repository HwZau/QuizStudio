import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export const fetchQuizzes = createAsyncThunk('quizzes/fetchAll', async (_, { getState }) =>
  api('/quizzes', { token: getState().auth.token }));
export const fetchQuiz = createAsyncThunk('quizzes/fetchOne', async (id, { getState }) =>
  api('/quizzes/' + id, { token: getState().auth.token }));
export const submitQuiz = createAsyncThunk('quizzes/submit', async ({ id, answers }, { getState }) =>
  api('/quizzes/' + id + '/submit', {
    method: 'POST', body: { answers }, token: getState().auth.token
  }));

const initialState = {
  list: [], listStatus: 'idle', current: null, currentStatus: 'idle',
  answers: {}, questionIndex: 0, result: null, submitStatus: 'idle', error: null
};
const quizSlice = createSlice({
  name: 'quizzes',
  initialState,
  reducers: {
    clearResult(state) {
      state.result = null; state.answers = {}; state.questionIndex = 0;
      state.submitStatus = 'idle'; state.error = null;
    },
    selectAnswer(state, action) {
      state.answers[action.payload.questionId] = action.payload.optionIndex;
    },
    nextQuestion(state) {
      if (state.current && state.questionIndex < state.current.questions.length - 1) {
        state.questionIndex += 1;
      }
    },
    resetQuizzes: () => initialState
  },
  extraReducers(builder) {
    builder
      .addCase(fetchQuizzes.pending, (state) => {
        state.listStatus = 'loading'; state.current = null; state.currentStatus = 'idle'; state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.listStatus = 'ready'; state.list = action.payload;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.listStatus = 'error'; state.error = action.error.message;
      })
      .addCase(fetchQuiz.pending, (state) => {
        state.currentStatus = 'loading'; state.current = null; state.error = null;
        state.answers = {}; state.questionIndex = 0; state.result = null; state.submitStatus = 'idle';
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.currentStatus = 'ready'; state.current = action.payload;
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.currentStatus = 'error'; state.error = action.error.message;
      })
      .addCase(submitQuiz.pending, (state) => { state.submitStatus = 'loading'; state.error = null; })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.submitStatus = 'ready'; state.result = action.payload;
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.submitStatus = 'error'; state.error = action.error.message;
      })
      .addCase('auth/logout', () => initialState);
  }
});
export const { clearResult, selectAnswer, nextQuestion, resetQuizzes } = quizSlice.actions;
export default quizSlice.reducer;
