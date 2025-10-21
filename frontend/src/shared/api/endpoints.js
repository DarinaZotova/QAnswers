// frontend/src/shared/api/endpoints.js
export const ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  posts: '/posts',
  categories: '/categories',

  verifyEmailRequest: '/auth/email/request', 
  emailStatus: '/auth/email/status',         

  requestPasswordReset: '/auth/password-reset',            
   changePassword: (token) => `/auth/password-reset/${token}`, 
  me: '/auth/me', 
  logout: '/auth/logout',
};
