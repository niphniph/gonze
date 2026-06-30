import { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { Tasks } from './pages/Tasks';
import { Habits } from './pages/Habits';
import { Finance } from './pages/Finance';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { Weekly } from './pages/Weekly';
import { CalendarPage } from './pages/CalendarPage';
import { Meetings } from './pages/Meetings';
import { GoogleIntegrations } from './pages/GoogleIntegrations';
import { FinanceAnalyzer } from './pages/FinanceAnalyzer';
import { db } from './utils/db';
import { LoginPage, RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'planner', label: 'Planner', icon: 'calendar_today' },
  { id: 'tasks', label: 'Tasks', icon: 'check_circle' },
  { id: 'habits', label: 'Habits', icon: 'repeat' },
  { id: 'finance', label: 'Finance', icon: 'payments' },
];

const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: 'dashboard' },
  { id: 'planner', label: 'Plan', icon: 'calendar_month' },
  { id: 'tasks', label: 'Tasks', icon: 'assignment' },
  { id: 'habits', label: 'Habits', icon: 'cached' },
  { id: 'finance', label: 'Finance', icon: 'account_balance_wallet' },
];

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [language, setLanguage] = useState(localStorage.getItem('tracker_lang') || 'en');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tracker_token') || null);
  const [loading, setLoading] = useState(true);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    const pageId = path.replace('/', '').split('?')[0] || 'dashboard';
    setActivePage(pageId);
  };

  const handleSetActivePage = (pageId) => {
    let path = '/' + pageId;
    if (pageId === 'dashboard') path = '/';
    window.history.pushState(null, '', path);
    setActivePage(pageId);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const pageId = path.replace('/', '') || 'dashboard';
      setActivePage(pageId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadUserData = async (authToken) => {
    try {
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (userRes.status === 404) {
        throw new Error('API_NOT_FOUND');
      }

      if (!userRes.ok) {
        throw new Error('Session invalid');
      }

      const userData = await userRes.json();
      setUser(userData.user);
      localStorage.setItem('tracker_email', userData.user.email);
      db.loadUserSpecificData(userData.user.email);

      if (!userData.user.is_verified) {
        navigate(`/verify-email?email=${encodeURIComponent(userData.user.email)}`);
        setLoading(false);
        return;
      }

      // Sync data from D1 database
      const syncRes = await fetch('/api/sync', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.success && syncData.data) {
          Object.keys(syncData.data).forEach(key => {
            if (syncData.data[key] !== null) {
              localStorage.setItem(key, JSON.stringify(syncData.data[key]));
            }
          });
        }
      }
    } catch (err) {
      if (err.message === 'API_NOT_FOUND' || err.message.includes('fetch')) {
        // Fallback to local session
        const localEmail = localStorage.getItem('tracker_email');
        if (localEmail) {
          setUser({ name: localEmail.split('@')[0], email: localEmail });
          db.loadUserSpecificData(localEmail);
        } else {
          handleLogout();
        }
      } else {
        console.warn("Session loading failed, logging out:", err.message);
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken, loggedInUser) => {
    if (newToken) {
      localStorage.setItem('tracker_token', newToken);
      setToken(newToken);
    }
    localStorage.setItem('tracker_email', loggedInUser.email);
    setUser(loggedInUser);
    db.loadUserSpecificData(loggedInUser.email);
    
    if (newToken) {
      loadUserData(newToken);
    } else {
      setLoading(false);
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    db.clearActiveSession();
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
    const localEmail = localStorage.getItem('tracker_email');

    if (token) {
      loadUserData(token);
    } else if (localEmail) {
      // Local fallback session
      setUser({ name: localEmail.split('@')[0], email: localEmail });
      db.loadUserSpecificData(localEmail);
      setLoading(false);
      
      if (publicPaths.includes(currentPath)) {
        navigate('/dashboard');
      } else {
        const pageId = currentPath.replace('/', '').split('?')[0] || 'dashboard';
        setActivePage(pageId);
      }
    } else {
      setLoading(false);
      if (!publicPaths.includes(currentPath)) {
        navigate('/login');
      } else {
        const pageId = currentPath.replace('/', '').split('?')[0] || 'dashboard';
        setActivePage(pageId);
      }
    }
  }, [token]);

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('tracker_lang', lang);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-fixed-dim/20 border-t-primary-fixed-dim animate-spin text-primary-fixed-dim"></div>
          <span className="font-body text-sm text-outline opacity-75">Loading Productivity Tracker...</span>
        </div>
      </div>
    );
  }

  const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const currentPath = window.location.pathname;
  const isAuthenticated = token || user;

  if (publicPaths.includes(currentPath) || !isAuthenticated) {
    const authProps = { navigate, onLoginSuccess: handleLoginSuccess };
    switch (activePage) {
      case 'login': return <LoginPage {...authProps} />;
      case 'register': return <RegisterPage {...authProps} />;
      case 'verify-email': return <VerifyEmailPage {...authProps} />;
      case 'forgot-password': return <ForgotPasswordPage {...authProps} />;
      case 'reset-password': return <ResetPasswordPage {...authProps} />;
      default: return <LoginPage {...authProps} />;
    }
  }

  const renderPage = () => {
    const pageProps = { language, setActivePage: handleSetActivePage };
    switch (activePage) {
      case 'dashboard': return <Dashboard {...pageProps} />;
      case 'planner': return <Planner {...pageProps} />;
      case 'tasks': return <Tasks {...pageProps} />;
      case 'habits': return <Habits {...pageProps} />;
      case 'finance': return <Finance {...pageProps} />;
      case 'weekly': return <Weekly {...pageProps} />;
      case 'calendar': return <CalendarPage {...pageProps} />;
      case 'meetings': return <Meetings {...pageProps} />;
      case 'finance_analyzer': return <FinanceAnalyzer {...pageProps} />;
      case 'google_integrations': return <GoogleIntegrations {...pageProps} />;
      case 'insights': return <Insights {...pageProps} />;
      case 'settings': return <Settings {...pageProps} handleSetLanguage={handleSetLanguage} />;
      default: return <Dashboard {...pageProps} />;
    }
  };

  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="bg-surface-container-lowest h-screen w-72 hidden md:flex flex-col fixed left-0 top-0 border-r border-outline-variant/30 z-50">
        <div className="flex flex-col h-full py-lg">
          <div className="px-8 mb-12">
            <h1 className="font-display text-3xl font-black text-primary-fixed-dim">Productivity</h1>
          </div>
          <div className="px-8 mb-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center overflow-hidden ring-4 ring-primary-fixed/10 font-bold text-on-primary-container text-lg">
              {userInitials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-headline-md text-base font-bold text-on-surface truncate">{user?.name || 'User'}</span>
              <span className="font-label text-[10px] text-primary-fixed-dim uppercase tracking-widest truncate">{user?.email || 'Pro Member'}</span>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSetActivePage(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'text-primary-fixed-dim font-bold bg-primary-fixed/10'
                      : 'text-on-surface-variant font-medium hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-body-md">{item.label}</span>
                </button>
              );
            })}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 cursor-pointer text-outline hover:bg-error-container/15 hover:text-error mt-4"
            >
              <span className="material-symbols-outlined text-error">logout</span>
              <span className="font-body-md text-error">Log Out</span>
            </button>
          </nav>
          <div className="px-8 mt-auto">
            <p className="font-label text-[10px] text-outline opacity-50">v2.4.0</p>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 md:ml-72 w-full h-screen overflow-y-auto relative pb-24 md:pb-0">
        {/* Top App Bar */}
        <header className="bg-surface/90 backdrop-blur-2xl sticky top-0 z-40 border-b border-outline-variant/20">
          <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full">
            <div className="flex items-center gap-6">
              <span className="material-symbols-outlined text-outline hover:text-primary-fixed-dim cursor-pointer transition-colors">search</span>
              <h2 className="font-headline-md text-xl md:text-2xl font-black text-primary-fixed-dim">
                Productivity Tracker
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleSetActivePage('insights')}
                className="bg-surface-container-high hover:bg-surface-bright px-6 md:px-8 py-2.5 md:py-3 rounded-full border border-outline-variant/30 flex items-center gap-3 transition-all duration-300 group cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary-fixed-dim text-lg group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="font-body-md font-bold text-on-surface text-xs md:text-sm">AI Assistant</span>
              </button>
              
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center cursor-pointer hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </div>

              {/* Top Header Logout Button */}
              <div 
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center cursor-pointer hover:bg-error-container/20 hover:text-error transition-colors"
                title="Log Out"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </div>
            </div>
          </div>
        </header>

        {renderPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-4 bg-surface-container-lowest/90 backdrop-blur-2xl border-t border-outline-variant/20 md:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSetActivePage(item.id)}
              className={`flex flex-col items-center justify-center rounded-full transition-all cursor-pointer ${
                isActive
                  ? 'text-primary-fixed-dim bg-primary-fixed/10 w-14 h-14'
                  : 'text-on-surface-variant w-14 h-14'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center rounded-full transition-all cursor-pointer text-error w-14 h-14"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
