import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. LOGIN PAGE
export function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('success') || params.get('message');
    if (msg) {
      setSuccessMessage(msg);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.notVerified) {
          navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        throw new Error(data.error || 'Invalid credentials');
      }

      onLoginSuccess(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Nine's Tracker</h1>
        <p className="auth-subtitle">Your Life, Quantified.</p>
        
        {error && (
          <div className="p-3 mb-4 rounded bg-red-900/30 border border-red-500/40 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 rounded bg-purple-900/30 border border-purple-500/40 text-purple-200 text-sm text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <input
              className="auth-input"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="auth-group">
            <div className="flex justify-between items-center mb-1.5">
              <label className="auth-label mb-0" htmlFor="password">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              className="auth-input"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="auth-link bg-transparent border-none p-0 cursor-pointer"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

// 2. REGISTER PAGE
export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, password, confirmPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-register">
        <h1 className="auth-title">Nine's Tracker</h1>
        <p className="auth-subtitle">Create your sanctuary for life tracking.</p>
        
        {error && (
          <div className="p-3 mb-4 rounded bg-red-900/30 border border-red-500/40 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label className="auth-label" htmlFor="fullName">Full Name</label>
            <input
              className="auth-input"
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="auth-group">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <input
              className="auth-input"
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-group">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              className="auth-input"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-group">
            <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              className="auth-input"
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="auth-link bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

// 3. VERIFY EMAIL PAGE
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') || '';
    const codeParam = params.get('code') || '';
    const tokenParam = params.get('token') || '';
    
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam);

    if (tokenParam) {
      autoVerifyToken(tokenParam);
    } else if (emailParam && codeParam) {
      autoVerifyCode(emailParam, codeParam);
    }
  }, []);

  const autoVerifyToken = async (tokenVal) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoVerifyCode = async (emailVal, codeVal) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, code: codeVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      setError('Please provide both email and verification code');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setSuccess('Email verified successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email to resend the code');
      return;
    }
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code');

      setSuccess('Verification code resent successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Verify Email</h1>
        <p className="auth-subtitle">Verify your account to access your dashboard.</p>
        
        {error && (
          <div className="p-3 mb-4 rounded bg-red-900/30 border border-red-500/40 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded bg-purple-900/30 border border-purple-500/40 text-purple-200 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleVerify} className="auth-form">
          <div className="auth-group">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="auth-group">
            <label className="auth-label">6-Digit Verification Code</label>
            <input
              className="auth-input text-center text-xl font-bold tracking-widest"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <div className="flex justify-between items-center mt-6 text-sm">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-indigo-300 hover:text-indigo-200 transition-colors bg-transparent border-none cursor-pointer font-medium"
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-slate-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. FORGOT PASSWORD PAGE
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.status === 404) throw new Error('API_NOT_FOUND');
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('If the email exists, a password reset link has been sent.');
    } catch (err) {
      if (err.message === 'API_NOT_FOUND' || err.message.includes('fetch')) {
        const localUsers = JSON.parse(localStorage.getItem('tracker_local_users') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        const found = localUsers.find(u => u.email === cleanEmail);
        
        if (found) {
          setSuccess(`Local Reset Link (mocked): /reset-password?token=local_reset_${cleanEmail}`);
        } else {
          setSuccess('If the email is registered, a password reset link has been sent.');
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email to receive a recovery link.</p>
        
        {error && (
          <div className="p-3 mb-4 rounded bg-red-900/30 border border-red-500/40 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded bg-purple-900/30 border border-purple-500/40 text-purple-200 text-sm text-center break-all">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="auth-link bg-transparent border-none p-0 cursor-pointer text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. RESET PASSWORD PAGE
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || '';
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing password reset token');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is missing');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      });
      if (res.status === 404) throw new Error('API_NOT_FOUND');

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.message === 'API_NOT_FOUND' || err.message.includes('fetch')) {
        if (token.startsWith('local_reset_')) {
          const email = token.replace('local_reset_', '');
          const localUsers = JSON.parse(localStorage.getItem('tracker_local_users') || '[]');
          const idx = localUsers.findIndex(u => u.email === email);
          
          if (idx !== -1) {
            localUsers[idx].password = password;
            localStorage.setItem('tracker_local_users', JSON.stringify(localUsers));
            
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
          } else {
            setError('User not found');
          }
        } else {
          setError('Invalid or expired reset token');
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>
        
        {error && (
          <div className="p-3 mb-4 rounded bg-red-900/30 border border-red-500/40 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded bg-purple-900/30 border border-purple-500/40 text-purple-200 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label className="auth-label">New Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token}
            />
          </div>

          <div className="auth-group">
            <label className="auth-label">Confirm New Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
            />
          </div>

          <button type="submit" disabled={loading || !token} className="auth-button">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="auth-link bg-transparent border-none p-0 cursor-pointer text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
