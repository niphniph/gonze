import React from 'react';
import { LayoutDashboard, CheckSquare, Calendar, RefreshCw, DollarSign, Award } from 'lucide-react';
import { db } from '../utils/db';

export const Navbar = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'dashboard', label: 'დეშბორდი', icon: LayoutDashboard },
    { id: 'tasks', label: 'დავალებები', icon: CheckSquare },
    { id: 'habits', label: 'ჩვევები', icon: Award },
    { id: 'weekly', label: 'კვირეული', icon: Calendar },
    { id: 'finance', label: 'ფინანსები', icon: DollarSign }
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="sidebar-nav glass-panel">
        <div className="nav-logo">
          <h2 className="text-gradient">GONZE</h2>
          <span className="logo-sub">პროდუქტიულობის ტრეკერი</span>
        </div>
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="nav-footer">
          <button onClick={db.resetDatabase} className="btn btn-secondary btn-reset">
            <RefreshCw size={14} />
            <span>ბაზის განულება</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav for Mobile */}
      <nav className="mobile-nav glass-panel">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
