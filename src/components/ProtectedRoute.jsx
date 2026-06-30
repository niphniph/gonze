import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('tracker_token');
  const localEmail = localStorage.getItem('tracker_email');
  const isAuthenticated = token || localEmail;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
