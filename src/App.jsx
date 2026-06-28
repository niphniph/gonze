import { useState } from 'react';
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

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('tracker_lang', lang);
  };

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

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="bg-surface-container-lowest h-screen w-72 hidden md:flex flex-col fixed left-0 top-0 border-r border-outline-variant/30 z-50">
        <div className="flex flex-col h-full py-lg">
          <div className="px-8 mb-12">
            <h1 className="font-display text-3xl font-black text-primary-fixed-dim">Productivity</h1>
          </div>
          <div className="px-8 mb-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center overflow-hidden ring-4 ring-primary-fixed/10">
              <img className="w-full h-full object-cover" alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt-_JfINy3vL-V4v3kSjinfRAHgopEwUG-5H604EnPUuo-up30xeKmKY0sFvlFYnMEeaXP_5I1HVRZVy8br5FCSh2DQ35MA5PbSvCx7huXODgwF5Ih2cDfhcYZG2ZGL-pDY7sFOHg3XeWn6vu0WbF79DG5Zsxm7xJkZ4QepQyUYKmuppRc_Pp-2M8XYuAShfuLPuJVJdvjxrPt7EmBc0xVmtwdCaY_ITxdDqA0fTj88EbNNERsWMDQgqvJZIEDIDAgXlsnZlpA-5M" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-base font-bold text-on-surface">Alex Rivers</span>
              <span className="font-label text-[10px] text-primary-fixed-dim uppercase tracking-widest">Pro Member</span>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
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
                onClick={() => setActivePage('insights')}
                className="bg-surface-container-high hover:bg-surface-bright px-6 md:px-8 py-2.5 md:py-3 rounded-full border border-outline-variant/30 flex items-center gap-3 transition-all duration-300 group cursor-pointer"
              >
                <span className="material-symbols-outlined text-primary-fixed-dim text-lg group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="font-body-md font-bold text-on-surface text-xs md:text-sm">AI Assistant</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center cursor-pointer hover:bg-surface-bright transition-colors">
                <span className="material-symbols-outlined text-xl">notifications</span>
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
              onClick={() => setActivePage(item.id)}
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
      </nav>
    </div>
  );
}

export default App;
