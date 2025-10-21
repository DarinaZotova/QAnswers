// frontend/src/components/AuthGuard.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function AuthGuard({ children }) {
  const user = useSelector(s => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
