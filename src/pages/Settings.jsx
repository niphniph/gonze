import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { 
  Settings as SettingsIcon, 
  Database, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  HardDrive,
  User,
  Lock
} from 'lucide-react';

export const Settings = () => {
  const [stats, setStats] = useState({
    tasks: 0,
    habits: 0,
    meetings: 0,
    transactions: 0,
    storageSize: '0 B'
  });

  const [username, setUsername] = useState('ნიკოლოზ კაპანაძე');
  const [email, setEmail] = useState('ninekapanadze@gmail.com');
  const [theme, setTheme] = useState('dark');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const localTasks = db.getTasks() || [];
    const localHabits = db.getHabits()?.list || [];
    const localMeetings = db.getMeetings() || [];
    const localTransactions = db.getTransactions() || [];

    // Calculate localStorage size
    let totalBytes = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        totalBytes += ((localStorage[x].length + x.length) * 2);
      }
    }
    
    let sizeStr = '0 B';
    if (totalBytes > 1024 * 1024) {
      sizeStr = (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (totalBytes > 1024) {
      sizeStr = (totalBytes / 1024).toFixed(2) + ' KB';
    } else {
      sizeStr = totalBytes + ' B';
    }

    setStats({
      tasks: localTasks.length,
      habits: localHabits.length,
      meetings: localMeetings.length,
      transactions: localTransactions.length,
      storageSize: sizeStr
    });
  };

  const handleClearStore = (storeKey, label) => {
    if (window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${label}-ის მონაცემების მთლიანად წაშლა?`)) {
      localStorage.removeItem(storeKey);
      setSuccessMsg(`${label}-ის მონაცემები წარმატებით წაიშალა.`);
      loadStats();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleFullReset = () => {
    if (window.confirm("ყურადღება! დარწმუნებული ხართ, რომ გსურთ მთლიანი მონაცემთა ბაზის განულება? ეს ქმედება შეუქცევადია.")) {
      db.resetDatabase();
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSuccessMsg("პროფილის პარამეტრები წარმატებით განახლდა.");
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="settings-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>პარამეტრები</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>მართეთ პროფილის პარამეტრები, მონაცემთა ბაზა და უსაფრთხოების კონტროლი</p>
      </header>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid hsl(var(--accent-emerald))',
          color: 'hsl(var(--accent-emerald))',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* User Profile settings */}
        <GlassCard>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'hsl(var(--primary))' }} />
            პროფილის პარამეტრები
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">სრული სახელი</label>
              <input 
                type="text" 
                className="form-input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ელ-ფოსტა</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ინტერფეისის თემა</label>
              <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="dark">Dark Theme (Glassmorphism)</option>
                <option value="light" disabled>Light Theme (მალე დაემატება)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              შენახვა
            </button>
          </form>
        </GlassCard>

        {/* Database statistics and Telemetry */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={20} style={{ color: 'hsl(var(--accent-blue))' }} />
            მონაცემების მოცულობა
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>დავალებები</span>
              <span style={{ fontWeight: 700 }}>{stats.tasks}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>ჩვევები</span>
              <span style={{ fontWeight: 700 }}>{stats.habits}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>შეხვედრები</span>
              <span style={{ fontWeight: 700 }}>{stats.meetings}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>ტრანზაქციები</span>
              <span style={{ fontWeight: 700 }}>{stats.transactions}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, paddingTop: '0.5rem' }}>
              <span style={{ color: 'hsl(var(--primary-hover))' }}>ბაზის მთლიანი ზომა</span>
              <span>{stats.storageSize}</span>
            </div>
          </div>
        </GlassCard>

        {/* Modular database reset and deletion (privacy compliance) */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--accent-rose))' }}>
            <ShieldAlert size={20} />
            უსაფრთხოება & მონაცემების მართვა
          </h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', lineHeight: '1.4' }}>
            კონფიდენციალურობის დაცვის მიზნით, შეგიძლიათ წაშალოთ ცალკეული მოდულების მონაცემები ან მთლიანად გაასუფთავოთ ბრაუზერის მეხსიერება.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              onClick={() => handleClearStore('gonze_tasks', 'დავალებები')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>დავალებების წაშლა</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={() => handleClearStore('gonze_habits', 'ჩვევები')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>ჩვევების წაშლა</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={() => handleClearStore('gonze_meetings', 'შეხვედრები')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>შეხვედრების წაშლა</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={() => handleClearStore('gonze_transactions', 'ტრანზაქციები')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>საბანკო ტრანზაქციების წაშლა</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={handleFullReset} 
              className="btn btn-danger" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
            >
              <RefreshCw size={14} />
              <span>ყველა მონაცემის განულება</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
