import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { logout } from '../features/auth/authSlice';
import { resetQuizzes } from '../features/quizzes/quizSlice';

export default function Layout({ admin = false }) {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  function signOut() {
    localStorage.removeItem('quizToken');
    dispatch(logout());
    dispatch(resetQuizzes());
    navigate('/login', { replace: true });
  }

  return (
    <div className={'dashboard-shell' + (location.pathname === '/admin/questions' ? ' questions-shell' : '')}>
      <header className="dashboard-header">
        <h1>{admin ? 'Admin Dashboard' : 'Dashboard'}</h1>
        <p>Welcome, {user?.username}</p>
      </header>
      <nav className="dashboard-nav" aria-label="Main navigation">
        <Link className="home-link" to={admin ? '/admin' : '/dashboard'}>Home</Link>
        {admin ? <>
          <Link to="/admin/questions">Manage Questions</Link>
          <Link to="/admin/quizzes">Manage Quizzes</Link>
          <Link to="/admin/articles">Manage Articles</Link>
        </> : <>
          <Link to="/dashboard/quiz">Quiz</Link>
          <Link to="/dashboard/articles">Article</Link>
        </>}
        <button type="button" onClick={signOut}>Logout</button>
      </nav>
      <main className="dashboard-content"><Outlet /></main>
    </div>
  );
}
