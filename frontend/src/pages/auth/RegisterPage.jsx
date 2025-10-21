// frontend/src/pages/auth/RegisterPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  register,
  requestEmailVerification,
  checkEmailStatus,
  emailReset
} from '../../features/auth/authActions';
import { Link } from 'react-router-dom';
import "../../styles/auth.css";


export default function RegisterPage() {
  const dispatch = useDispatch();
  const { loading, error, emailVerification } = useSelector(s => s.auth);

  const [form, setForm] = useState({
    login: '',
    full_name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [touched, setTouched] = useState({});
  const [localErr, setLocalErr] = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    if (emailVerification.verified && emailVerification.email && form.email !== emailVerification.email) {
      dispatch(emailReset());
    }
  }, [form.email, emailVerification.verified, emailVerification.email, dispatch]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.login.trim()) return 'Login is required';
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.passwordConfirm) return 'Passwords do not match';
    return null;
  };

  const onConfirmEmail = async (e) => {
    e.preventDefault();
    if (!validEmail) {
      setLocalErr('Enter a valid email to confirm');
      return;
    }
    setLocalErr(null);
    await dispatch(requestEmailVerification(form.email));
  };

  useEffect(() => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    const shouldPoll =
      emailVerification.sent &&
      !emailVerification.verified &&
      validEmail &&
      (!emailVerification.email || emailVerification.email === form.email);

    if (shouldPoll && !pollRef.current) {
      pollRef.current = setInterval(() => {
        dispatch(checkEmailStatus(form.email));
      }, 3000);
    }

    if ((!shouldPoll || emailVerification.verified) && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [
    dispatch,
    form.email,
    emailVerification.sent,
    emailVerification.verified,
    emailVerification.email
  ]);

  const onSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    setLocalErr(v);
    if (v) return;
    const { login, full_name, email, password, passwordConfirm } = form;
    dispatch(register({ login, fullName: full_name, email, password, passwordConfirm }));
  };

    const isEmailConfirmedForThisForm = emailVerification.sent && emailVerification.email === form.email;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    const confirmBtnDisabled = loading || !validEmail;

     const signUpDisabled =
          loading || !isEmailConfirmedForThisForm;

  return (
  <div className="auth-form auth-form--lg">
    <h2 className="auth-title">Register</h2>
    <p className="auth-sub">Welcome! Please register</p>

    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label">Login</label>
        <input
          className="input"
          name="login"
          value={form.login}
          onChange={onChange}
          onBlur={() => setTouched(t => ({ ...t, login: true }))}
          placeholder="you_nickname"
          required
        />
        {touched.login && !form.login.trim() && (
          <div className="error">Login is required</div>
        )}
      </div>

      <div className="field">
        <label className="label">Full name</label>
        <input
          className="input"
          name="full_name"
          value={form.full_name}
          onChange={onChange}
          onBlur={() => setTouched(t => ({ ...t, full_name: true }))}
          placeholder="Your full name"
          required
        />
        {touched.full_name && !form.full_name.trim() && (
          <div className="error">Full name is required</div>
        )}
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          onBlur={() => setTouched(t => ({ ...t, email: true }))}
          placeholder="qanswers@gmail.com"
          required
        />
        {touched.email && !form.email.trim() && (
          <div className="error">Email is required</div>
        )}
        {isEmailConfirmedForThisForm && (
          <div className="ok">Email confirmed ✔</div>
        )}
      </div>

      <div className="field">
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          onBlur={() => setTouched(t => ({ ...t, password: true }))}
          minLength={6}
          required
        />
        {touched.password && form.password.length < 6 && (
          <div className="error">At least 6 characters</div>
        )}
      </div>

      <div className="field">
        <label className="label">Confirm password</label>
        <input
          className="input"
          type="password"
          name="passwordConfirm"
          value={form.passwordConfirm}
          onChange={onChange}
          onBlur={() => setTouched(t => ({ ...t, passwordConfirm: true }))}
          required
        />
        {touched.passwordConfirm && form.passwordConfirm !== form.password && (
          <div className="error">Passwords do not match</div>
        )}
      </div>

      {(localErr || error) && (
        <div className="error">{localErr || error}</div>
      )}

      <div className="row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onConfirmEmail}
          disabled={confirmBtnDisabled}
        >
          {emailVerification.sent && !isEmailConfirmedForThisForm
            ? "Resend confirmation"
            : "Confirm"}
        </button>

        <button
          type="submit"
          className="btn"
          disabled={signUpDisabled}
          title={!isEmailConfirmedForThisForm ? "Confirm your email first" : undefined}
        >
          Sign up
        </button>
      </div>
    </form>

    <div className="auth-links">
      {emailVerification.sent && !isEmailConfirmedForThisForm && (
        <div>We sent a message to <b>{form.email}</b>. Once your email is verified, the <b>Sign up</b> button will become available automatically.</div>
      )}
    </div>

    <div className="auth-links">
      Already have an account? <Link to="/login">Log in</Link>
    </div>
  </div>
);

}
