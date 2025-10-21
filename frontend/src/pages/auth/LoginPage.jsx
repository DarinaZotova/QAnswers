// frontend/src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../features/auth/authActions';
import { Link, useNavigate } from 'react-router-dom';

import "../../styles/auth.css";


export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);

  const [loginOrEmail, setLoginOrEmail] = useState('');
  const [password, setPassword]         = useState('');
  const [localErr, setLocalErr]         = useState(null);


const onSubmit = async (e) => {
  e.preventDefault();
  if (!loginOrEmail.trim() || !password) {
    setLocalErr('Enter login/email and password');
    return;
  }
  setLocalErr(null);
  const res = await dispatch(login({ loginOrEmail, password })); 
  if (res?.ok) {
    navigate('/'); 
  }
};

  return (
  <div className="auth-form">
    <h2 className="auth-title">Login</h2>
    <p className="auth-sub">Welcome back! Please login to your account</p>

    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label">Login/Email</label>
        
        <input
          className="input"
          name="loginOrEmail"
          value={loginOrEmail}
          onChange={(e) => setLoginOrEmail(e.target.value)}
          placeholder="qanswers@gmail.com"
          required
        />
      </div>

      <div className="field">
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {(localErr || error) && (
        <div className="error">{localErr || error}</div>
      )}

      <div className="row">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>

    <div className="auth-links" style={{ marginTop: 16 }}>
      New user? <Link to="/register">Sign up</Link>
    </div>
    <div className="auth-links reset-link" style={{ marginTop: 8 }}>
     <Link to="/reset-password">Forgot password?</Link>
    </div>
  </div>
);

}
