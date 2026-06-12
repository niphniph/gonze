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

export const Navbar = ({ activePage, setActivePage }) => {
  const navCategories = [
    {
      title: 'პროდუქტიულობა',
      items: [
        { id: 'dashboard', label: 'დეშბორდი', icon: LayoutDashboard },
        { id: 'planner', label: 'პლანერი', icon: Clock },
        { id: 'tasks', label: 'დავალებები', icon: CheckSquare },
        { id: 'habits', label: 'ჩვევები', icon: Award },
        { id: 'weekly', label: 'კვირეული', icon: CalendarDays },
        { id: 'calendar', label: 'კალენდარი', icon: Calendar },
        { id: 'meetings', label: 'შეხვედრები', icon: Video }
      ]
    },
    {
      title: 'ფინანსები',
      items: [
        { id: 'finance', label: 'ფინანსები', icon: DollarSign },
        { id: 'finance_analyzer', label: 'ანალიზი', icon: PieChart }
      ]
    },
    {
      title: 'კავშირი & სისტემა',
      items: [
        { id: 'google_integrations', label: 'Google ინტეგრაცია', icon: Link },
        { id: 'insights', label: 'ინსაითები', icon: Sparkles },
        { id: 'settings', label: 'პარამეტრები', icon: Settings }
      ]
    }
  ];

  // Mobile Bottom Nav items (primary 5 items for mobile viewport)
  const mobileNavItems = [
    { id: 'dashboard', label: 'დეშბორდი', icon: LayoutDashboard },
    { id: 'planner', label: 'პლანერი', icon: Clock },
    { id: 'meetings', label: 'შეხვედრები', icon: Video },
    { id: 'finance_analyzer', label: 'ანალიზი', icon: PieChart },
    { id: 'settings', label: 'პარამეტრები', icon: Settings }
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="sidebar-nav glass-panel" style={{ height: 'auto', minHeight: 'calc(100vh - 2rem)' }}>
        <div className="nav-logo" style={{ marginBottom: '1.5rem' }}>
          <h2 className="text-gradient">GONZE</h2>
          <span className="logo-sub">პროდუქტიულობის ტრეკერი</span>
        </div>
        
        <nav className="nav-menu" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 12rem)', paddingRight: '0.25rem' }}>
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

