// src/features/auth/authActions.js
import { api } from '../../shared/api/axios';
import { ENDPOINTS } from '../../shared/api/endpoints';
import { clearPosts } from '../posts/postsActions';
import {
  AUTH_LOADING, AUTH_ERROR, AUTH_SET_TOKEN, AUTH_SET_USER,
  AUTH_LOGOUT, AUTH_EMAIL_SENT, AUTH_EMAIL_VERIFIED, AUTH_EMAIL_RESET,
  AUTH_PW_RESET_SENT, AUTH_PW_CHANGED
} from './authTypes';
import {
  setAuth, clearAuth, getUser, getToken,
  setVerifiedEmail, clearVerifiedEmail, getVerifiedEmail
} from '../../shared/utils/storage';

const setLoading = (v) => ({ type: AUTH_LOADING, payload: v });
const setError   = (e) => ({ type: AUTH_ERROR, payload: e });
export const setToken = (t) => ({ type: AUTH_SET_TOKEN, payload: t });
export const setUser  = (u) => ({ type: AUTH_SET_USER,  payload: u });
export const emailSent    = (email) => ({ type: AUTH_EMAIL_SENT, payload: email });
export const emailVerified= (email) => ({ type: AUTH_EMAIL_VERIFIED, payload: email });
export const emailReset   = () => ({ type: AUTH_EMAIL_RESET });
export const logoutSync   = () => ({ type: AUTH_LOGOUT });

export const bootstrapAuth = () => async (dispatch) => {
  const token = getToken();
  const savedUser = getUser();

  if (token) dispatch(setToken(token));
  if (savedUser) dispatch(setUser(savedUser));

  if (token) {
    try {
      dispatch(setLoading(true)); dispatch(setError(null));
      const { data } = await api.get(ENDPOINTS.me);
      dispatch(setUser(data));
      setAuth(token, data);
    } catch {
      clearAuth();
      dispatch(logoutSync());
    } finally {
      dispatch(setLoading(false));
    }
  }
};

export const register =
  ({ login, fullName, email, password, passwordConfirm }) =>
  async (dispatch) => {
    dispatch(setLoading(true)); dispatch(setError(null));
    try {
      const payload = {
        login,
        email,
        full_name: fullName,                    
        password,
        password_confirmation: passwordConfirm,
      };
      await api.post(ENDPOINTS.register, payload);
      dispatch(emailSent(email));
      setVerifiedEmail(email);
      return { ok: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed';
      dispatch(setError(msg));
      return { ok: false, error: msg };
    } finally {
      dispatch(setLoading(false));
    }
  };

export const requestEmailVerification = (email) => async (dispatch) => {
  dispatch(setLoading(true)); dispatch(setError(null));
  try {
    await api.post(ENDPOINTS.verifyEmailRequest, { email });
    dispatch(emailSent(email));
    setVerifiedEmail(email);
    return { ok: true };
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to send email';
    dispatch(setError(msg));
    return { ok: false, error: msg };
  } finally {
    dispatch(setLoading(false));
  }
};

export const checkEmailStatus = (email) => async (dispatch) => {
  try {
    const { data } = await api.get(`${ENDPOINTS.emailStatus}?email=${encodeURIComponent(email)}`);
    if (data?.verified) {
      dispatch(emailVerified(email));
      clearVerifiedEmail();
      return { ok: true };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
};

export const clearEmailStatus = () => (dispatch)=> {
  clearVerifiedEmail();
  dispatch(emailReset());
};

export const login =
  ({ loginOrEmail, password }) =>
  async (dispatch) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const payload = { loginOrEmail: loginOrEmail.trim(), password };

      const { data } = await api.post(ENDPOINTS.login, payload);

      const { token, ...user } = data || {};
      if (!token || !user) throw new Error("Bad payload");

      dispatch(setToken(token));
      dispatch(setUser(user));
      setAuth(token, user);

      return { ok: true, user };
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid login or password";
      dispatch(setError(msg));
      return { ok: false, error: msg };
    } finally {
      dispatch(setLoading(false));
    }
  };

export const logout = () => async (dispatch) => {
  try { await api.post(ENDPOINTS.logout); } catch {}
  clearAuth();
  dispatch(logoutSync());
  dispatch(clearPosts());
};

export const resetPasswordRequest = (email) => async (dispatch) => {
  dispatch(setLoading(true)); dispatch(setError(null));
  try {
    await api.post(ENDPOINTS.requestPasswordReset, { email });
    dispatch({ type: AUTH_PW_RESET_SENT, payload: email });
    return { ok: true };
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to send reset link';
    dispatch(setError(msg));
    return { ok: false, error: msg };
  } finally {
    dispatch(setLoading(false));
  }
};

export const resetPasswordChange = ({ token, newPassword }) => async (dispatch) => {
  if (!token) {
    dispatch(setError('Missing token'));
    return { ok: false };
  }
  dispatch(setLoading(true)); dispatch(setError(null));
  try {
    await api.post(ENDPOINTS.changePassword(token), { new_password: newPassword });
    dispatch({ type: AUTH_PW_CHANGED });
    return { ok: true };
  } catch (err) {
    const data = err?.response?.data;
    const msg = typeof data === 'string' ? data : data?.message || 'Failed to change password';
    dispatch(setError(msg));
    return { ok: false, error: msg };
  } finally {
    dispatch(setLoading(false));
  }
};
