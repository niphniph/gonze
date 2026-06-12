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

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'planner':
        return <Planner setActivePage={setActivePage} />;
      case 'tasks':
        return <Tasks />;
      case 'habits':
        return <Habits />;
      case 'weekly':
        return <Weekly />;
      case 'calendar':
        return <CalendarPage />;
      case 'meetings':
        return <Meetings />;
      case 'finance':
        return <Finance />;
      case 'finance_analyzer':
        return <FinanceAnalyzer />;
      case 'google_integrations':
        return <GoogleIntegrations />;
      case 'insights':
        return <Insights />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

