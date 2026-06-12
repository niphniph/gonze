import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  CalendarDays,
  RefreshCw, 
  DollarSign, 
  Award, 
  Clock, 
  Video, 
  Link, 
  PieChart, 
  Sparkles, 
  Settings 
} from 'lucide-react';
import { db } from '../utils/db';

export const Navbar = ({ activePage, setActivePage, language, setLanguage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);

  const navCategories = [
    {
      title: t('პროდუქტიულობა', 'Productivity'),
      items: [
        { id: 'dashboard', label: t('დეშბორდი', 'Dashboard'), icon: LayoutDashboard },
        { id: 'planner', label: t('პლანერი', 'Planner'), icon: Clock },
        { id: 'tasks', label: t('დავალებები', 'Tasks'), icon: CheckSquare },
        { id: 'habits', label: t('ჩვევები', 'Habits'), icon: Award },
        { id: 'weekly', label: t('კვირეული', 'Weekly Tracker'), icon: CalendarDays },
        { id: 'calendar', label: t('კალენდარი', 'Calendar'), icon: Calendar },
        { id: 'meetings', label: t('შეხვედრები', 'Meetings'), icon: Video }
      ]
    },
    {
      title: t('ფინანსები', 'Finance'),
      items: [
        { id: 'finance', label: t('ფინანსები', 'Finance Ledger'), icon: DollarSign },
        { id: 'finance_analyzer', label: t('ანალიზი', 'Finance Analyzer'), icon: PieChart }
      ]
    },
    {
      title: t('კავშირი & სისტემა', 'System'),
      items: [
        { id: 'google_integrations', label: t('Google ინტეგრაცია', 'Google Integration'), icon: Link },
        { id: 'insights', label: t('ინსაითები', 'AI Insights'), icon: Sparkles },
        { id: 'settings', label: t('პარამეტრები', 'Settings'), icon: Settings }
      ]
    }
  ];

  // Mobile Bottom Nav items (primary 5 items for mobile viewport)
  const mobileNavItems = [
    { id: 'dashboard', label: t('დეშბორდი', 'Dashboard'), icon: LayoutDashboard },
    { id: 'planner', label: t('პლანერი', 'Planner'), icon: Clock },
    { id: 'meetings', label: t('შეხვედრები', 'Meetings'), icon: Video },
    { id: 'finance_analyzer', label: t('ანალიზი', 'Finance'), icon: PieChart },
    { id: 'settings', label: t('პარამეტრები', 'Settings'), icon: Settings }
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="sidebar-nav glass-panel" style={{ height: 'auto', minHeight: 'calc(100vh - 2rem)' }}>
        <div className="nav-logo" style={{ marginBottom: '1.25rem' }}>
          <h2 className="text-gradient">GONZE</h2>
          <span className="logo-sub">{t('პროდუქტიულობის ტრეკერი', 'Productivity Tracker')}</span>
          
          {/* Language Switcher under logo */}
          <div style={{ 
            display: 'flex', 
            gap: '0.25rem', 
            marginTop: '0.75rem', 
            background: 'rgba(0, 0, 0, 0.25)', 
            borderRadius: '8px', 
            padding: '0.2rem', 
            width: 'fit-content',
            border: '1px solid var(--border-light)' 
          }}>
            <button 
              onClick={() => setLanguage('ka')} 
              style={{ 
                background: language === 'ka' ? 'hsl(var(--primary-glow))' : 'transparent',
                color: language === 'ka' ? 'hsl(var(--primary-hover))' : 'hsl(var(--text-muted))',
                border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              GE
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              style={{ 
                background: language === 'en' ? 'hsl(var(--primary-glow))' : 'transparent',
                color: language === 'en' ? 'hsl(var(--primary-hover))' : 'hsl(var(--text-muted))',
                border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              EN
            </button>
          </div>
        </div>
        
        <nav className="nav-menu" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 14rem)', paddingRight: '0.25rem' }}>
          {navCategories.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '1.25rem' }}>
              <div style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                color: 'hsl(var(--text-muted))',
                marginBottom: '0.5rem',
                paddingLeft: '0.5rem'
              }}>
                {cat.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="mobile-nav glass-panel">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

