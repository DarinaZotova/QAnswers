// frontend/src/shared/api/axios.js
import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';

export const api = axios.create({
baseURL: 'http://localhost:3000/api',
  withCredentials: true, 
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
      if (location.pathname !== '/login') location.assign('/login');
    }
    return Promise.reject(err);
  }
);
