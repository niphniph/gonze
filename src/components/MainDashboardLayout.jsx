import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Planner } from '../pages/Planner';
import { Tasks } from '../pages/Tasks';
import { Habits } from '../pages/Habits';
import { Finance } from '../pages/Finance';
import { Insights } from '../pages/Insights';
import { Settings } from '../pages/Settings';
import { Weekly } from '../pages/Weekly';
import { CalendarPage } from '../pages/CalendarPage';
import { Meetings } from '../pages/Meetings';
import { GoogleIntegrations } from '../pages/GoogleIntegrations';
import { FinanceAnalyzer } from '../pages/FinanceAnalyzer';
import { Navbar } from './Navbar';
import { db } from '../utils/db';

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

export default function MainDashboardLayout() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [language, setLanguage] = useState(localStorage.getItem('tracker_lang') || 'en');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  const loadUserData = async () => {
    const token = localStorage.getItem('tracker_token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userRes = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        if (userData.error && userData.error.includes("Database is not connected")) {
          setDbError(userData.error);
          setLoading(false);
          return;
        }
        throw new Error(userData.error || 'Session invalid');
      }

      setUser(userData.user);
      db.loadUserSpecificData(userData.user.email);

      if (!userData.user.email_verified) {
        navigate(`/verify-email?email=${encodeURIComponent(userData.user.email)}`);
        return;
      }

      // Sync D1 data
      const syncRes = await fetch('/api/sync', {
        headers: { 'Authorization': `Bearer ${token}` }
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
      console.warn("Session loading failed, logging out:", err.message);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = () => {
    db.clearActiveSession();
    navigate('/login');
  };

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('tracker_lang', lang);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-fixed-dim/20 border-t-primary-fixed-dim animate-spin text-primary"></div>
          <span className="font-body text-sm text-outline opacity-75">Syncing your workspace...</span>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 rounded-xl border border-red-500/20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">database_alert</span>
          </div>
          <h2 className="font-display text-xl font-bold text-on-surface mb-4">Database Connection Error</h2>
          <p className="font-body text-sm text-red-200 leading-relaxed mb-6">
            {dbError}
          </p>
          <button 
            onClick={handleLogout}
            className="bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container px-6 py-3 rounded-full font-bold text-sm transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    const pageProps = { language, setActivePage };
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
    <div className="flex min-h-screen overflow-hidden bg-background w-full">
      {/* Sidebar and Mobile Bottom Navigation */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        language={language} 
        setLanguage={handleSetLanguage} 
        onLogout={handleLogout} 
      />

      {/* Main Canvas */}
      <main className="flex-1 md:ml-64 w-full h-screen overflow-y-auto relative pb-24 md:pb-0">
        {/* Top App Bar */}
        <header className="bg-surface/90 backdrop-blur-2xl sticky top-0 z-40 border-b border-outline-variant/20">
          <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 w-full">
            <div className="flex items-center gap-6">
              <span className="material-symbols-outlined text-outline hover:text-primary cursor-pointer transition-colors">search</span>
              <h2 className="font-headline-md text-xl md:text-2xl font-black text-primary">
                Productivity Tracker
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActivePage('insights')}
                className="bg-surface-container-high hover:bg-surface-bright px-6 md:px-8 py-2.5 md:py-3 rounded-full border border-outline-variant/30 flex items-center gap-3 transition-all duration-300 group cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary text-lg group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
    </div>
  );
}
