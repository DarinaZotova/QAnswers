// frontend/src/pages/auth/ChangePasswordPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordChange } from '../../features/auth/authActions';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import "../../styles/auth.css";


export default function ChangePasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, passwordReset } = useSelector(s => s.auth);

  const params = useParams();
  const [sp] = useSearchParams();

  const token = useMemo(() => {
    return (
      params.confirm_token ||
      params.token ||
      sp.get('confirm_token') ||
      sp.get('token') ||
      ''
    );
  }, [params, sp]);

  const [pw, setPw] = useState('');
  const [touched, setTouched] = useState(false);

  const strongEnough = pw.length >= 6;

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!strongEnough || !token) return;
    dispatch(resetPasswordChange({ token, newPassword: pw }));
  };

  useEffect(() => {
    if (passwordReset.changed) {
      const t = setTimeout(() => navigate('/login', { replace: true }), 800);
      return () => clearTimeout(t);
    }
  }, [passwordReset.changed, navigate]);

  if (!token) {
    return (
      <div>
        <h2>Change password</h2>
        <div style={{ color: 'crimson' }}>Missing token</div>
        <p style={{ marginTop: 12 }}>
          <Link to="/reset-password">Request a new link</Link>
        </p>
      </div>
    );
  }

  return (
  <div className="auth-form auth-form--sm">
    <h2 className="auth-title">Change password</h2>
    <p className="auth-sub">Set a new password for your account</p>

    {passwordReset.changed ? (
      <>
        <div className="ok">Password changed successfully.</div>
        <p className="auth-links" style={{ marginTop: 12 }}>
          Redirecting to <Link to="/login">Log in</Link>…
        </p>
      </>
    ) : (
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onBlur={() => setTouched(true)}
            required
          />
          {touched && !strongEnough && (
            <div className="error">At least 6 characters</div>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="row">
          <button
            type="submit"
            className="btn"
            disabled={loading || !strongEnough}
          >
            {loading ? "Changing..." : "Change"}
          </button>
        </div>
      </form>
    )}

    <p className="auth-links" style={{ marginTop: 16 }}>
      <Link to="/login">Back to login</Link>
    </p>
  </div>
);

}
