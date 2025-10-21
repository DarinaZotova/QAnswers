// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { bootstrapAuth } from './features/auth/authActions';

import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import HomePage from "./pages/HomePage";
import CategoriesPage from "./pages/CategoriesPage";
import ProfilePage from "./pages/ProfilePage";

import SplashScreen from "./components/SplashScreen";
import PostPage from "./pages/PostPage";
import AdminPage from "./pages/AdminPage";


export default function App() {
  const dispatch = useDispatch();
  const [booted, setBooted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let cancel = false;

    const MIN_SPLASH_MS = 1200; 
    const minTimer = new Promise(res => setTimeout(res, MIN_SPLASH_MS));
    const boot = (async () => { try { await dispatch(bootstrapAuth()); } finally { if (!cancel) setBooted(true); }})();

    Promise.all([minTimer, boot]).then(() => {
      if (!cancel) setShowSplash(false);
    });

    return () => { cancel = true; };
  }, [dispatch]);

  return (
    <div className={`app ${showSplash ? "" : "app--ready"}`}>
      <SplashScreen hide={!showSplash} />

      <main className="app__content">
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/profile/:user_id?" element={<ProfilePage />} />
            <Route path="/posts/:post_id" element={<PostPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route
            path="/register"
            element={
              <AuthLayout 
                cardClass="auth-card--lg"
                left={<div className="auth-hero">Welcome!<span className="brand">
                  <img src="/logo.png" alt="QAnswers" className="auth-logo auth-logo--sm" />
                </span></div>}
              >
                <RegisterPage />
              </AuthLayout>
            }
          />

          <Route
            path="/login"
            element={
              <AuthLayout
                cardClass="auth-card--md"
                left={<div className="auth-hero">Welcome<br/>Back!<span className="brand">
                  <img src="/logo.png" alt="QAnswers" className="auth-logo auth-logo--sm" />
                </span></div>}
              >
                <LoginPage />
              </AuthLayout>
            }
          />

          <Route
            path="/reset-password"
            element={
              <AuthLayout 
                cardClass="auth-card--md"
                left={<div className="auth-hero">Reset<br/>Password<span className="brand">
                  <img src="/logo.png" alt="QAnswers" className="auth-logo auth-logo--sm" />
                </span></div>}
              >
                <ResetPasswordPage />
              </AuthLayout>
            }
          />

          <Route
            path="/change-password"
            element={
              <AuthLayout 
                cardClass="auth-card--sm"
                left={<div className="auth-hero">Change<br/>password<span className="brand">
                  <img src="/logo.png" alt="QAnswers" className="auth-logo auth-logo--sm" />
                </span></div>}
              >
                <ChangePasswordPage />
              </AuthLayout>
            }
          />

          <Route
            path="/change-password/:confirm_token"
            element={
              <AuthLayout 
                cardClass="auth-card--sm"
                left={<div className="auth-hero">Change<br/>password<span className="brand">
                  <img src="/logo.png" alt="QAnswers" className="auth-logo auth-logo--sm" />
                </span></div>}
              >
                <ChangePasswordPage />
              </AuthLayout>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
