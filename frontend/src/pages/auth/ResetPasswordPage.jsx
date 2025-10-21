// frontend/src/pages/auth/ResetPasswordPage.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordRequest } from '../../features/auth/authActions';
import { Link } from 'react-router-dom';
import "../../styles/auth.css";


export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const { loading, error, passwordReset } = useSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!validEmail) return;
    dispatch(resetPasswordRequest(email));
  };

  if (passwordReset.sent) {
    return (
      <div>
        <h2>Reset link sent</h2>
        <p>We’ve sent a password reset link to <b>{passwordReset.email}</b>.</p>
        <p>Check your inbox and follow the link to set a new password.</p>
        <p style={{ marginTop: 12 }}>
          Remember your password? <Link to="/login">Log in</Link>
        </p>
      </div>
    );
  }

  return (
  <div className="auth-form auth-form--md">
    <h2 className="auth-title">Forgot your password? Don't worry! </h2>
    <p className="auth-sub">Enter your current email address </p>

    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="qanswers@gmail.com"
          required
        />
        {touched && !validEmail && (
          <div className="error">Enter a valid email</div>
        )}
      </div> <br />
       <p className="auth-sub">(You will be sent a link to create a new password by email)</p>
      {error && <div className="error">{error}</div>}

      <div className="row">
        <button
          type="submit"
          className="btn"
          disabled={loading || !validEmail}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </form>

    <div className="auth-links">
      Remember your password? <Link to="/login">Log in</Link>
    </div>
  </div>
);

}
