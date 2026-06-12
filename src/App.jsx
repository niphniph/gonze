import React, { useState } from 'react';
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
  const [language, setLanguage] = useState(localStorage.getItem('gonze_lang') || 'en');

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('gonze_lang', lang);
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

  return (
    <div className="app-layout">
      <Navbar activePage={activePage} setActivePage={setActivePage} language={language} setLanguage={handleSetLanguage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

