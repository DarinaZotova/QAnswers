// src/shared/utils/storage.js
const TOKEN_KEY = 'usof_token';
const USER_KEY  = 'usof_user';
const VERIFIED_EMAIL_KEY = 'usof_verified_email';

export const setAuth = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);

  if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setVerifiedEmail = (email) => {
  if (email) localStorage.setItem(VERIFIED_EMAIL_KEY, email);
};
export const getVerifiedEmail = () => localStorage.getItem(VERIFIED_EMAIL_KEY);
export const clearVerifiedEmail = () => localStorage.removeItem(VERIFIED_EMAIL_KEY);
