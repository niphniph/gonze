import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import ProtectedRoute from './components/ProtectedRoute';
import MainDashboardLayout from './components/MainDashboardLayout';
import { db } from './utils/db';

export default function App() {
  const handleLoginSuccess = (newToken, loggedInUser) => {
    if (newToken) {
      localStorage.setItem('tracker_token', newToken);
    }
    localStorage.setItem('tracker_email', loggedInUser.email);
    db.loadUserSpecificData(loggedInUser.email);
  };

  return (
    <BrowserRouter basename="/tracker">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainDashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
