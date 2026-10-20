import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate } from 'react-router';
import { clearAuthError, login, register } from '../features/auth/authSlice';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { token, user, status, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(clearAuthError());
    setUsername('');
    setPassword('');
    setShowPassword(false);
  }, [dispatch, mode]);

  if (token && user) return <Navigate to={user.admin ? '/admin' : '/dashboard'} replace />;

  async function submit(event) {
    event.preventDefault();
    try {
      const result = await dispatch((isRegister ? register : login)({ username, password })).unwrap();
      navigate(result.user.admin ? '/admin' : '/dashboard', { replace: true });
    } catch {
      // The authentication slice supplies the error message.
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title">{isRegister ? 'Register' : 'Login'}</h1>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input className="form-control" id="username" name="username" autoComplete="username"
              minLength={3} required value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrap">
              <input className="form-control" id="password" name="password" type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 8 : undefined} required value={password}
                onChange={(event) => setPassword(event.target.value)} />
              {password && <button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                <svg width="28" height="24" viewBox="0 0 28 24" fill="none" aria-hidden="true">
                  <path d="M2 12C5 5 9 3 14 3s9 2 12 9c-3 7-7 9-12 9S5 19 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="14" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                  {showPassword && <path d="M3 2 25 22" stroke="currentColor" strokeWidth="1.8" />}
                </svg>
              </button>}
            </div>
          </div>
          <button className="btn btn-primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <Link className="auth-switch" to={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Already have an account? Login here' : "Don't have an account? Register here"}
        </Link>
      </section>
    </main>
  );
}
