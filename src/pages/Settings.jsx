import { useState } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  HardDrive,
  User
} from 'lucide-react';

const computeStats = () => {
  const localTasks = db.getTasks() || [];
  const localHabits = db.getHabits()?.list || [];
  const localMeetings = db.getMeetings() || [];
  const localTransactions = db.getTransactions() || [];

  // Calculate localStorage size
  let totalBytes = 0;
  for (let x in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
      totalBytes += ((localStorage[x].length + x.length) * 2);
    }
  }
  
  let sizeStr;
  if (totalBytes > 1024 * 1024) {
    sizeStr = (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (totalBytes > 1024) {
    sizeStr = (totalBytes / 1024).toFixed(2) + ' KB';
  } else {
    sizeStr = totalBytes + ' B';
  }

  return {
    tasks: localTasks.length,
    habits: localHabits.length,
    meetings: localMeetings.length,
    transactions: localTransactions.length,
    storageSize: sizeStr
  };
};

export const Settings = ({ language, handleSetLanguage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  
  const [stats, setStats] = useState(() => computeStats());

  const [username, setUsername] = useState(() => db.getProfile().name);
  const [email, setEmail] = useState(() => db.getProfile().email);
  const [theme, setTheme] = useState('dark');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStats = () => {
    setStats(computeStats());
  };

  const handleClearStore = (storeKey, labelGeo, labelEn) => {
    const label = language === 'ka' ? labelGeo : labelEn;
    if (window.confirm(t(`დარწმუნებული ხართ, რომ გსურთ ${label}-ის მონაცემების მთლიანად წაშლა?`, `Are you sure you want to completely delete ${label} data?`))) {
      localStorage.removeItem(storeKey);
      setSuccessMsg(t(`${label}-ის მონაცემები წარმატებით წაიშალა.`, `${label} data deleted successfully.`));
      loadStats();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleFullReset = () => {
    if (window.confirm(t("ყურადღება! დარწმუნებული ხართ, რომ გსურთ მთლიანი მონაცემთა ბაზის განულება? ეს ქმედება შეუქცევადია.", "Warning! Are you sure you want to reset the entire database? This action is irreversible."))) {
      db.resetDatabase();
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    db.saveProfile({ name: username, email });
    setSuccessMsg(t("პროფილის პარამეტრები წარმატებით განახლდა.", "Profile settings updated successfully."));
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="settings-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('პარამეტრები', 'Settings')}</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('მართეთ პროფილის პარამეტრები, მონაცემთა ბაზა და უსაფრთხოების კონტროლი', 'Manage profile settings, database and security controls')}</p>
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
            {t('პროფილის პარამეტრები', 'Profile Settings')}
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('სრული სახელი', 'Full Name')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('ელ-ფოსტა', 'Email')}</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('პროექტის ენა', 'Project Language')}</label>
              <select className="form-select" value={language} onChange={e => handleSetLanguage(e.target.value)}>
                <option value="en">English (EN)</option>
                <option value="ka">Georgian (KA)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('ინტერფეისის თემა', 'Interface Theme')}</label>
              <select className="form-select" value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="dark">Dark Theme (Glassmorphism)</option>
                <option value="light" disabled>{t('Light Theme (მალე დაემატება)', 'Light Theme (coming soon)')}</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {t('შენახვა', 'Save')}
            </button>
          </form>
        </GlassCard>

        {/* Database statistics and Telemetry */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={20} style={{ color: 'hsl(var(--accent-blue))' }} />
            {t('მონაცემების მოცულობა', 'Data Storage Volume')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>{t('დავალებები', 'Tasks')}</span>
              <span style={{ fontWeight: 700 }}>{stats.tasks}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>{t('ჩვევები', 'Habits')}</span>
              <span style={{ fontWeight: 700 }}>{stats.habits}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>{t('შეხვედრები', 'Meetings')}</span>
              <span style={{ fontWeight: 700 }}>{stats.meetings}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>{t('ტრანზაქციები', 'Transactions')}</span>
              <span style={{ fontWeight: 700 }}>{stats.transactions}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, paddingTop: '0.5rem' }}>
              <span style={{ color: 'hsl(var(--primary-hover))' }}>{t('ბაზის მთლიანი ზომა', 'Total Database Size')}</span>
              <span>{stats.storageSize}</span>
            </div>
          </div>
        </GlassCard>

        {/* Modular database reset and deletion (privacy compliance) */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--accent-rose))' }}>
            <ShieldAlert size={20} />
            {t('უსაფრთხოება & მონაცემების მართვა', 'Security & Data Management')}
          </h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', lineHeight: '1.4' }}>
            {t('კონფიდენციალურობის დაცვის მიზნით, შეგიძლიათ წაშლოთ ცალკეული მოდულების მონაცემები ან მთლიანად გაასუფთავოთ ბრაუზერის მეხსიერება.', 'For privacy protection, you can delete data of individual modules or completely clear the browser storage.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              onClick={() => handleClearStore('tracker_tasks', 'დავალებები', 'Tasks')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>{t('დავალებების წაშლა', 'Delete Tasks')}</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={() => handleClearStore('tracker_habits', 'ჩვევები', 'Habits')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>{t('ჩვევების წაშლა', 'Delete Habits')}</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={() => handleClearStore('tracker_meetings', 'შეხვედრები', 'Meetings')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>{t('შეხვედრების წაშლა', 'Delete Meetings')}</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={() => handleClearStore('tracker_transactions', 'ტრანზაქციები', 'Transactions')} 
              className="btn btn-secondary" 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem' }}
            >
              <span>{t('საბანკო ტრანზაქციების წაშლა', 'Delete Bank Transactions')}</span>
              <Trash2 size={14} style={{ color: 'hsl(var(--accent-rose))' }} />
            </button>

            <button 
              onClick={handleFullReset} 
              className="btn btn-danger" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
            >
              <RefreshCw size={14} />
              <span>{t('ყველა მონაცემის განულება', 'Reset All Data')}</span>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
