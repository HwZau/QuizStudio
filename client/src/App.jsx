import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { restoreSession } from './features/auth/authSlice';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import QuizPage from './pages/QuizPage';
import AdminPage from './pages/AdminPage';
import QuizManagementPage from './pages/QuizManagementPage';
import ArticlePage from './pages/ArticlePage';

function Protected({ admin = false, children }) {
  const { initialized, token, user } = useSelector((state) => state.auth);
  if (!initialized) return <div className="loading-screen" role="status">Loading...</div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (admin && !user.admin) return <Navigate to="/dashboard" replace />;
  if (!admin && user.admin) return <Navigate to="/admin" replace />;
  return children;
}

function HomeRedirect() {
  const { initialized, token, user } = useSelector((state) => state.auth);
  if (!initialized) return <div className="loading-screen" role="status">Loading...</div>;
  return <Navigate to={token && user ? user.admin ? '/admin' : '/dashboard' : '/login'} replace />;
}

function LegacyQuizRedirect() {
  const { quizId } = useParams();
  return <Navigate to={'/dashboard/quiz/' + quizId} replace />;
}

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const token = localStorage.getItem('quizToken');
    if (token) dispatch(restoreSession(token));
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/dashboard" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="quiz/:quizId" element={<QuizPage />} />
        <Route path="articles" element={<ArticlePage />} />
      </Route>
      <Route path="/admin" element={<Protected admin><Layout admin /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="questions" element={<AdminPage />} />
        <Route path="quizzes" element={<QuizManagementPage />} />
        <Route path="articles" element={<ArticlePage admin />} />
      </Route>
      <Route path="/quizzes/:quizId" element={<LegacyQuizRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
