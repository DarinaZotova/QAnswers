// src/features/auth/authReducer.js
import {
  AUTH_LOADING, AUTH_ERROR, AUTH_SET_TOKEN, AUTH_SET_USER,
  AUTH_LOGOUT, AUTH_EMAIL_SENT, AUTH_EMAIL_VERIFIED, AUTH_EMAIL_RESET,
  AUTH_PW_RESET_SENT, AUTH_PW_CHANGED
} from './authTypes';

const initial = {
  loading: false,
  error: null,
  token: null,
  user: null,

  emailVerification: { sent: false, verified: false, email: null },
  passwordReset: { sent: false, changed: false, email: null },
};

export const authReducer = (state = initial, action) => {
  switch (action.type) {
    case AUTH_LOADING:
      return { ...state, loading: action.payload };
    case AUTH_ERROR:
      return { ...state, error: action.payload };

    case AUTH_SET_TOKEN:
      return { ...state, token: action.payload };
    case AUTH_SET_USER:
      return { ...state, user: action.payload };

    case AUTH_LOGOUT:
      return { ...initial };

    case AUTH_EMAIL_SENT:
      return {
        ...state,
        emailVerification: {
          sent: true,
          verified: false,
          email: action.payload || state.emailVerification.email || null,
        },
      };
    case AUTH_EMAIL_VERIFIED:
      return {
        ...state,
        emailVerification: {
          sent: true,
          verified: true,
          email: action.payload || state.emailVerification.email || null,
        },
      };
    case AUTH_EMAIL_RESET:
      return { ...state, emailVerification: { sent: false, verified: false, email: null } };

    case AUTH_PW_RESET_SENT:
      return { ...state, passwordReset: { sent: true, changed: false, email: action.payload } };
    case AUTH_PW_CHANGED:
      return { ...state, passwordReset: { ...state.passwordReset, changed: true } };

    default:
      return state;
  }
};
