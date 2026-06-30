import { useState, useEffect } from 'react';

// Common Background Orbs and Layout wrapper
function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-margin-mobile py-12 relative overflow-hidden antialiased">
      {/* Background Glow Orbs */}
      <div className="absolute rounded-full blur-[100px] opacity-15 pointer-events-none -z-10 bg-primary w-[400px] h-[400px] -top-[100px] -left-[100px]"></div>
      <div className="absolute rounded-full blur-[100px] opacity-15 pointer-events-none -z-10 bg-secondary w-[300px] h-[300px] -bottom-[50px] -right-[50px]"></div>
      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}

// Common Brand Header
function AuthHeader({ subtitle }) {
  return (
    <div className="text-center">
      <h1 className="font-headline-lg text-headline-lg brand-logo-text mb-2 bg-gradient-to-r from-text-primary to-primary bg-clip-text text-transparent">
        Nine's Tracker
      </h1>
      <p className="font-body-md text-body-md text-text-muted">{subtitle}</p>
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
        const localUsers = JSON.parse(localStorage.getItem('tracker_local_users') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        const found = localUsers.find(u => u.email === cleanEmail && u.password === password);
        
        if (!found) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

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
    <AuthLayout>
      <AuthHeader subtitle="Your Life, Quantified." />
      <div className="bg-surface border-t border-l border-white/5 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] shadow-primary/5 backdrop-blur-md p-8 md:p-10 rounded-xl flex flex-col gap-6">
        <h2 className="font-headline-lg text-headline-lg text-center text-text-primary">Welcome Back</h2>
        
        {error && (
          <div className="p-4 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-md text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-lg bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body-md text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted select-none pointer-events-none">
                mail
              </span>
              <input
                className="bg-surface-variant border border-transparent text-text-primary placeholder:text-text-muted w-full rounded-lg h-12 pl-12 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_4px_12px_rgba(192,193,255,0.1)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-label-sm text-label-sm text-primary hover:text-primary-fixed-dim transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted select-none pointer-events-none">
                lock
              </span>
              <input
                className="bg-surface-variant border border-transparent text-text-primary placeholder:text-text-muted w-full rounded-lg h-12 pl-12 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_4px_12px_rgba(192,193,255,0.1)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg font-title-lg text-title-lg flex items-center justify-center gap-2 mt-8 bg-gradient-to-r from-primary-container to-primary text-on-primary hover:opacity-90 hover:shadow-[0_8px_20px_rgba(192,193,255,0.2)] active:translate-y-[1px] transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Login'}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        <p className="mt-4 text-center font-body-md text-body-md text-text-muted">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-primary hover:text-primary-fixed-dim font-medium transition-colors cursor-pointer"
          >
            Register
          </button>
        </p>
      </div>
    </AuthLayout>
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

      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err.message === 'API_NOT_FOUND' || err.message.includes('fetch')) {
        const localUsers = JSON.parse(localStorage.getItem('tracker_local_users') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        
        if (localUsers.some(u => u.email === cleanEmail)) {
          setError('Email is already registered');
          setLoading(false);
          return;
        }

        localUsers.push({ name: name.trim(), email: cleanEmail, password });
        localStorage.setItem('tracker_local_users', JSON.stringify(localUsers));

        navigate(`/login?success=${encodeURIComponent("Account created successfully. Please log in.")}`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader subtitle="Create your sanctuary for life tracking." />
      <div className="bg-surface border-t border-l border-white/5 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] shadow-primary/5 backdrop-blur-md p-8 rounded-xl flex flex-col gap-6">
        <h2 className="font-headline-lg text-headline-lg text-center text-text-primary">Create Account</h2>
        
        {error && (
          <div className="p-4 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="fullName">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                person
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                mail
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                lock
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                lock_reset
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg font-title-lg text-title-lg flex items-center justify-center gap-2 mt-6 bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary hover:opacity-90 hover:shadow-[0_10px_20px_-10px_theme(colors.primary)] active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </form>

        <p className="mt-4 text-center font-body-md text-body-md text-text-muted">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:text-primary-fixed-dim font-medium transition-colors cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </AuthLayout>
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
    <AuthLayout>
      <AuthHeader subtitle="Verify your account to access your dashboard." />
      <div className="bg-surface border-t border-l border-white/5 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] shadow-primary/5 backdrop-blur-md p-8 rounded-xl flex flex-col gap-6">
        <h2 className="font-headline-lg text-headline-lg text-center text-text-primary">Verify Email</h2>
        <p className="font-body-md text-sm text-text-muted text-center">
          Enter the 6-digit verification code sent to your email.
        </p>
        
        {error && (
          <div className="p-4 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body-md text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                mail
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1">
              6-Digit Verification Code
            </label>
            <div className="relative">
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 text-center text-2xl tracking-[0.5em] font-bold focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg font-title-lg text-title-lg flex items-center justify-center gap-2 mt-6 bg-gradient-to-r from-primary-container to-primary text-on-primary hover:opacity-90 hover:shadow-[0_8px_20px_rgba(192,193,255,0.2)] active:translate-y-[1px] transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-sm font-body-md">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-text-muted hover:text-text-primary cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
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
    <AuthLayout>
      <AuthHeader subtitle="Password Recovery" />
      <div className="bg-surface border-t border-l border-white/5 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] shadow-primary/5 backdrop-blur-md p-8 rounded-xl flex flex-col gap-6">
        <h2 className="font-headline-lg text-headline-lg text-center text-text-primary">Forgot Password</h2>
        <p className="font-body-md text-sm text-text-muted text-center">
          Enter your email to receive a password recovery link.
        </p>
        
        {error && (
          <div className="p-4 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body-md text-sm break-all">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                mail
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg font-title-lg text-title-lg flex items-center justify-center gap-2 mt-6 bg-gradient-to-r from-primary-container to-primary text-on-primary hover:opacity-90 hover:shadow-[0_8px_20px_rgba(192,193,255,0.2)] active:translate-y-[1px] transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:text-primary-fixed-dim font-medium transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
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
    <AuthLayout>
      <AuthHeader subtitle="Password Recovery" />
      <div className="bg-surface border-t border-l border-white/5 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] shadow-primary/5 backdrop-blur-md p-8 rounded-xl flex flex-col gap-6">
        <h2 className="font-headline-lg text-headline-lg text-center text-text-primary">Reset Password</h2>
        <p className="font-body-md text-sm text-text-muted text-center">
          Enter your new password below.
        </p>
        
        {error && (
          <div className="p-4 rounded-lg bg-error-container/20 border border-error/30 text-error font-body-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-primary-container/20 border border-primary-fixed-dim/30 text-primary-fixed-dim font-body-md text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1">
              New Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                lock
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline select-none pointer-events-none">
                lock_reset
              </span>
              <input
                className="bg-surface-container border border-transparent text-on-surface placeholder:text-outline-variant w-full rounded-lg h-12 pl-10 pr-4 font-body-md text-body-md focus:border-b-primary focus:shadow-[0_2px_0_0_theme(colors.primary)] focus:bg-surface-container-high focus:outline-none transition-all duration-300"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={!token}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full h-12 rounded-lg font-title-lg text-title-lg flex items-center justify-center gap-2 mt-6 bg-gradient-to-r from-primary-container to-primary text-on-primary hover:opacity-90 hover:shadow-[0_8px_20px_rgba(192,193,255,0.2)] active:translate-y-[1px] transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:text-primary-fixed-dim font-medium transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
