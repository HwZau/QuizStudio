import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import quizzes from '../features/quizzes/quizSlice';
import questions from '../features/questions/questionSlice';
import articles from '../features/articles/articleSlice';

export const store = configureStore({
  reducer: { auth, quizzes, questions, articles }
});
