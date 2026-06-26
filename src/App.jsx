import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Habits } from './pages/Habits';
import { Weekly } from './pages/Weekly';
import { Finance } from './pages/Finance';
import { Planner } from './pages/Planner';
import { CalendarPage } from './pages/CalendarPage';
import { Meetings } from './pages/Meetings';
import { GoogleIntegrations } from './pages/GoogleIntegrations';
import { FinanceAnalyzer } from './pages/FinanceAnalyzer';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [language, setLanguage] = useState(localStorage.getItem('tracker_lang') || 'en');

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('tracker_lang', lang);
  };

  const renderPage = () => {
    const pageProps = { language, setActivePage };
    switch (activePage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />;
      case 'planner':
        return <Planner {...pageProps} />;
      case 'tasks':
        return <Tasks {...pageProps} />;
      case 'habits':
        return <Habits {...pageProps} />;
      case 'weekly':
        return <Weekly {...pageProps} />;
      case 'calendar':
        return <CalendarPage {...pageProps} />;
      case 'meetings':
        return <Meetings {...pageProps} />;
      case 'finance':
        return <Finance {...pageProps} />;
      case 'finance_analyzer':
        return <FinanceAnalyzer {...pageProps} />;
      case 'google_integrations':
        return <GoogleIntegrations {...pageProps} />;
      case 'insights':
        return <Insights {...pageProps} />;
      case 'settings':
        return <Settings {...pageProps} handleSetLanguage={handleSetLanguage} />;
      default:
        return <Dashboard {...pageProps} />;
    }
  };

  const t = (ka, en) => (language === 'ka' ? ka : en);

  return (
    <div className="app-layout">
      <Navbar activePage={activePage} setActivePage={setActivePage} language={language} setLanguage={handleSetLanguage} />
      <div className="main-wrapper">
        {/* Top App Bar */}
        <header className="bg-surface-container/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border-hairline shadow-sm h-16 w-full flex items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-text-secondary hover:text-white cursor-pointer transition-colors">search</span>
            <h2 className="font-headline-md text-base md:text-lg font-bold text-accent-indigo">
              {t('პროდუქტიულობის ტრეკერი', 'Productivity Tracker')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActivePage('insights')}
              className="bg-white/5 hover:bg-surface-bright/50 px-3.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 transition-all duration-200 group cursor-pointer"
            >
              <span className="material-symbols-outlined text-accent-indigo text-lg group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="font-body-md text-xs md:text-sm font-medium">{t('AI ასისტენტი', 'AI Assistant')}</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">notifications</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;

