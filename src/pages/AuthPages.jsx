import { useState, useEffect } from 'react';

// Common header for authentication pages
function AuthHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className="font-display text-4xl font-black text-primary-fixed-dim tracking-tight mb-2">Productivity</h1>
      <p className="font-body text-sm text-outline opacity-75">Your unified habits, tasks, and finance tracker</p>
    </div>
  );
}

// 1. LOGIN PAGE
export function LoginPage({ navigate, onLoginSuccess }) {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.status === 404) {
        throw new Error('API_NOT_FOUND');
      }

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
      if (err.message === 'API_NOT_FOUND' || err.message.includes('fetch')) {
        // LocalStorage Fallback Mode
        const localUsers = JSON.parse(localStorage.getItem('tracker_local_users') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        const found = localUsers.find(u => u.email === cleanEmail && u.password === password);
        
        if (!found) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

        // Simulating login success (token = null signals local session)
        onLoginSuccess(null, { name: found.name, email: found.email });
        navigate('/dashboard');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-margin-mobile py-12">
      <div className="w-full max-w-md">
        <AuthHeader />
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/30">
          <h2 className="text-2xl font-black text-on-surface mb-6">Log In</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error font-body text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="name@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-primary-fixed-dim hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 rounded-full mt-4"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-body text-outline">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-primary-fixed-dim font-bold hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. REGISTER PAGE
export function RegisterPage({ navigate }) {
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
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters long and contain both letters and numbers');
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      if (res.status === 404) {
        throw new Error('API_NOT_FOUND');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // API successful -> Redirect to verify code
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err.message === 'API_NOT_FOUND' || err.message.includes('fetch')) {
        // LocalStorage Fallback Mode
        const localUsers = JSON.parse(localStorage.getItem('tracker_local_users') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        
        if (localUsers.some(u => u.email === cleanEmail)) {
          setError('Email is already registered');
          setLoading(false);
          return;
        }

        localUsers.push({ name: name.trim(), email: cleanEmail, password });
        localStorage.setItem('tracker_local_users', JSON.stringify(localUsers));

        // Skip verification on local mock, redirect to login directly
        navigate(`/login?success=${encodeURIComponent("Account created successfully. Please log in.")}`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-margin-mobile py-12">
      <div className="w-full max-w-md">
        <AuthHeader />
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/30">
          <h2 className="text-2xl font-black text-on-surface mb-6">Create Account</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error font-body text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Alex Rivers"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="name@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="At least 8 chars with letter & number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Repeat password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 rounded-full mt-4"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-body text-outline">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-fixed-dim font-bold hover:underline cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. VERIFY EMAIL PAGE
export function VerifyEmailPage({ navigate }) {
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
    
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam);

    if (emailParam && codeParam) {
      autoVerify(emailParam, codeParam);
    }
  }, []);

  const autoVerify = async (emailVal, codeVal) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, code: codeVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

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
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

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
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('Verification code resent successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-margin-mobile py-12">
      <div className="w-full max-w-md">
        <AuthHeader />
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/30">
          <h2 className="text-2xl font-black text-on-surface mb-2">Verify Email</h2>
          <p className="font-body text-sm text-outline opacity-75 mb-6">
            Enter the 6-digit verification code sent to your email.
          </p>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error font-body text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="name@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">6-Digit Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                className="form-input text-center text-2xl tracking-[0.5em] font-bold"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 rounded-full mt-4"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="flex justify-between items-center mt-8 text-sm font-body">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary-fixed-dim font-bold hover:underline cursor-pointer"
            >
              {resending ? 'Sending...' : 'Resend verification code'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-outline hover:text-on-surface cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. FORGOT PASSWORD PAGE
export function ForgotPasswordPage({ navigate }) {
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

      setSuccess('If the email exists, a password reset link has been sent. Please check your inbox.');
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
    <div className="min-h-screen flex items-center justify-center bg-background px-margin-mobile py-12">
      <div className="w-full max-w-md">
        <AuthHeader />
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/30">
          <h2 className="text-2xl font-black text-on-surface mb-2">Forgot Password</h2>
          <p className="font-body text-sm text-outline opacity-75 mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error font-body text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="name@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 rounded-full mt-4"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-body">
            <button
              onClick={() => navigate('/login')}
              className="text-primary-fixed-dim font-bold hover:underline cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. RESET PASSWORD PAGE
export function ResetPasswordPage({ navigate }) {
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
    <div className="min-h-screen flex items-center justify-center bg-background px-margin-mobile py-12">
      <div className="w-full max-w-md">
        <AuthHeader />
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/30">
          <h2 className="text-2xl font-black text-on-surface mb-2">Reset Password</h2>
          <p className="font-body text-sm text-outline opacity-75 mb-6">
            Enter your new secure password.
          </p>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-error font-body text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="At least 8 chars with letter & number"
                required
                disabled={!token}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Repeat password"
                required
                disabled={!token}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn btn-primary w-full py-3 rounded-full mt-4"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-body">
            <button
              onClick={() => navigate('/login')}
              className="text-primary-fixed-dim font-bold hover:underline cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
