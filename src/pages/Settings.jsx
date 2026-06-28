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
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      <header className="flex flex-col gap-2">
        <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('პარამეტრები', 'Settings')}</h2>
        <p className="font-body-md text-on-surface-variant">{t('მართეთ პროფილის პარამეტრები, მონაცემთა ბაზა და უსაფრთხოების კონტროლი', 'Manage profile settings, database and security controls')}</p>
      </header>

      {successMsg && (
        <div className="bg-green-400/10 border border-green-400/20 text-green-400 p-4 rounded-xl flex items-center gap-3 font-semibold">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* User Profile settings */}
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <User size={20} className="text-primary-fixed-dim" />
            <span>{t('პროფილის პარამეტრები', 'Profile Settings')}</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('სრული სახელი', 'Full Name')}</label>
              <input 
                type="text" 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('ელ-ფოსტა', 'Email')}</label>
              <input 
                type="email" 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('პროექტის ენა', 'Project Language')}</label>
              <select 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer" 
                value={language} 
                onChange={e => handleSetLanguage(e.target.value)}
              >
                <option value="en" className="bg-surface-container-high">English (EN)</option>
                <option value="ka" className="bg-surface-container-high">Georgian (KA)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('ინტერფეისის თემა', 'Interface Theme')}</label>
              <select 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer" 
                value={theme} 
                onChange={e => setTheme(e.target.value)}
              >
                <option value="dark" className="bg-surface-container-high">Dark Theme (Glassmorphism)</option>
                <option value="light" disabled className="bg-surface-container-high">{t('Light Theme (მალე დაემატება)', 'Light Theme (coming soon)')}</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-sm py-3 px-6 rounded-full cursor-pointer transition-all border-none active:scale-95 mt-2">
              {t('შენახვა', 'Save')}
            </button>
          </form>
        </div>

        {/* Database statistics and Telemetry */}
        <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
          <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
            <HardDrive size={20} className="text-secondary-fixed-dim" />
            <span>{t('მონაცემების მოცულობა', 'Data Storage Volume')}</span>
          </h3>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">{t('დავალებები', 'Tasks')}</span>
              <span className="font-bold text-on-surface">{stats.tasks}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">{t('ჩვევები', 'Habits')}</span>
              <span className="font-bold text-on-surface">{stats.habits}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">{t('შეხვედრები', 'Meetings')}</span>
              <span className="font-bold text-on-surface">{stats.meetings}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-outline-variant/10">
              <span className="text-on-surface-variant">{t('ტრანზაქციები', 'Transactions')}</span>
              <span className="font-bold text-on-surface">{stats.transactions}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-2">
              <span className="text-primary-fixed-dim">{t('ბაზის მთლიანი ზომა', 'Total Database Size')}</span>
              <span className="text-on-surface">{stats.storageSize}</span>
            </div>
          </div>
        </div>

        {/* Modular database reset and deletion (privacy compliance) */}
        <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
          <h3 className="font-headline-md text-lg font-bold text-error flex items-center gap-2">
            <ShieldAlert size={20} />
            <span>{t('უსაფრთხოება & მონაცემების მართვა', 'Security & Data Management')}</span>
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
            {t('კონფიდენციალურობის დაცვის მიზნით, შეგიძლიათ წაშლოთ ცალკეული მოდულების მონაცემები ან მთლიანად გაასუფთავოთ ბრაუზერის მეხსიერება.', 'For privacy protection, you can delete data of individual modules or completely clear the browser storage.')}
          </p>

          <div className="flex flex-col gap-3 mt-2">
            <button 
              onClick={() => handleClearStore('tracker_tasks', 'დავალებები', 'Tasks')} 
              className="w-full flex justify-between items-center bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface px-4 py-3 rounded-xl border border-outline-variant/30 transition-all cursor-pointer"
            >
              <span>{t('დავალებების წაშლა', 'Delete Tasks')}</span>
              <Trash2 size={14} className="text-error" />
            </button>

            <button 
              onClick={() => handleClearStore('tracker_habits', 'ჩვევები', 'Habits')} 
              className="w-full flex justify-between items-center bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface px-4 py-3 rounded-xl border border-outline-variant/30 transition-all cursor-pointer"
            >
              <span>{t('ჩვევების წაშლა', 'Delete Habits')}</span>
              <Trash2 size={14} className="text-error" />
            </button>

            <button 
              onClick={() => handleClearStore('tracker_meetings', 'შეხვედრები', 'Meetings')} 
              className="w-full flex justify-between items-center bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface px-4 py-3 rounded-xl border border-outline-variant/30 transition-all cursor-pointer"
            >
              <span>{t('შეხვედრების წაშლა', 'Delete Meetings')}</span>
              <Trash2 size={14} className="text-error" />
            </button>

            <button 
              onClick={() => handleClearStore('tracker_transactions', 'ტრანზაქციები', 'Transactions')} 
              className="w-full flex justify-between items-center bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface px-4 py-3 rounded-xl border border-outline-variant/30 transition-all cursor-pointer"
            >
              <span>{t('საბანკო ტრანზაქციების წაშლა', 'Delete Bank Transactions')}</span>
              <Trash2 size={14} className="text-error" />
            </button>

            <button 
              onClick={handleFullReset} 
              className="w-full bg-error/10 hover:bg-error/20 text-error font-bold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 border border-error/20 transition-all cursor-pointer active:scale-95 mt-2"
            >
              <RefreshCw size={14} />
              <span>{t('ყველა მონაცემის განულება', 'Reset All Data')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
