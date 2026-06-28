import { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { googleService } from '../services/googleService';
import { GlassCard } from '../components/GlassCard';
import { 
  Globe, 
  CheckCircle2, 
  Trash2, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Key, 
  Settings 
} from 'lucide-react';

export const GoogleIntegrations = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [integrations, setIntegrations] = useState(() => db.getIntegrations());

  const [loading, setLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const handleAuthSuccess = () => {
      const updated = db.getIntegrations();
      setIntegrations(updated);
      setSuccessMessage(language === 'ka' ? "Google-ის ანგარიში წარმატებით დაუკავშირდა!" : "Google account connected successfully!");
      setTimeout(() => setSuccessMessage(''), 4000);
    };

    window.addEventListener('google-auth-success', handleAuthSuccess);
    return () => window.removeEventListener('google-auth-success', handleAuthSuccess);
  }, [language]);

  const saveState = (updated) => {
    setIntegrations(updated);
    db.saveIntegrations(updated);
  };

  const handleInputChange = (field, val) => {
    saveState({ ...integrations, [field]: val });
  };

  const togglePermission = (perm) => {
    const updatedPerms = { 
      ...integrations.permissions, 
      [perm]: !integrations.permissions[perm] 
    };
    saveState({ ...integrations, permissions: updatedPerms });
  };

  const toggleDemoMode = () => {
    saveState({ ...integrations, demoMode: !integrations.demoMode });
  };

  const handleConnect = async () => {
    if (!integrations.demoMode && (!integrations.clientId || !integrations.apiKey)) {
      alert(t("გთხოვთ შეიყვანოთ Client ID და API Key რეალურ რეჟიმში დასაკავშირებლად.", "Please enter Client ID and API Key to connect in production mode."));
      return;
    }
    setLoading(true);
    try {
      if (integrations.demoMode) {
        setLoading(false);
        setShowConsentModal(true);
      } else {
        await googleService.connect();
        setLoading(false);
      }
    } catch (err) {
      alert(err.message || 'Connection failed.');
      setLoading(false);
    }
  };

  const handleApproveConsent = async () => {
    setShowConsentModal(false);
    setLoading(true);
    try {
      const updated = await googleService.connect();
      setIntegrations(updated);
      setSuccessMessage(t("Google-ის ანგარიში წარმატებით დაუკავშირდა!", "Google account connected successfully!"));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm(t("დარწმუნებული ხართ, რომ გსურთ კავშირის გაწყვეტა?", "Are you sure you want to disconnect?"))) {
      const updated = await googleService.disconnect();
      setIntegrations(updated);
      setSuccessMessage(t("კავშირი გაწყვეტილია.", "Connection disconnected."));
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      <header className="flex flex-col gap-2">
        <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('ინტეგრაციები', 'Integrations')}</h2>
        <p className="font-body-md text-on-surface-variant">{t('დაუკავშირეთ Google სერვისები თქვენს პლატფორმას ავტომატური კალენდრისა და შეხვედრებისთვის', 'Connect Google services to your platform for automated calendars and meetings')}</p>
      </header>

      {successMessage && (
        <div className="bg-green-400/10 border border-green-400/20 text-green-400 p-4 rounded-xl flex items-center gap-3 font-semibold">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Connection panel */}
        <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
            <h3 className="font-headline-md text-lg font-bold text-on-surface">Google Connection</h3>
            <div className="flex items-center gap-2">
              <span className="font-body-md text-xs text-on-surface-variant">{t('სიმულაციის რეჟიმი', 'Sandbox Mode')}</span>
              <button 
                onClick={toggleDemoMode} 
                className="text-primary-fixed-dim bg-transparent border-none cursor-pointer p-1"
              >
                {integrations.demoMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>

          {integrations.connected && integrations.profile ? (
            <div className="flex flex-col items-center p-6 bg-surface-container-low/50 border border-outline-variant/10 rounded-xl w-full">
              <img 
                src={integrations.profile.avatar} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full mb-4 border-2 border-primary-fixed-dim object-cover"
                onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
              />
              <h4 className="font-headline-md text-base font-bold text-on-surface">{integrations.profile.name}</h4>
              <p className="font-body-md text-xs text-on-surface-variant mb-4">{integrations.profile.email}</p>
              
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                <span className="font-label text-[10px] px-2.5 py-1 rounded-full bg-green-400/10 text-green-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Active Token
                </span>
                <span className={`font-label text-[10px] px-2.5 py-1 rounded-full font-bold ${
                  integrations.demoMode ? 'bg-sky-400/10 text-sky-400' : 'bg-primary-fixed/10 text-primary-fixed-dim'
                }`}>
                  {integrations.demoMode ? 'Sandbox' : 'Production'}
                </span>
              </div>

              <button onClick={handleDisconnect} className="w-full bg-error/10 hover:bg-error/20 text-error font-bold text-sm py-3 px-6 rounded-full cursor-pointer transition-all border border-error/20 flex items-center justify-center gap-2 active:scale-95">
                <Trash2 size={16} />
                <span>{t('კავშირის გაწყვეტა (Disconnect)', 'Disconnect Account')}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center p-8 bg-surface-container-low/50 border border-outline-variant/10 rounded-xl text-center w-full">
              <div className="w-14 h-14 rounded-full bg-primary-fixed/10 flex items-center justify-center mb-4 text-primary-fixed-dim">
                <Globe size={28} />
              </div>
              <h4 className="font-headline-md text-base font-bold text-on-surface mb-2">{t('დაუკავშირეთ Google ანგარიში', 'Connect Google Account')}</h4>
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mb-6">
                {t('მოახდინეთ კალენდრის სინქრონიზაცია და დააგენერირეთ Google Meet ბმულები თქვენი დავალებებისა და შეხვედრებისთვის.', 'Sync your calendar and generate Google Meet links for your tasks and meetings.')}
              </p>
              
              <button 
                onClick={handleConnect} 
                disabled={loading}
                className="w-full bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-sm py-3 px-6 rounded-full cursor-pointer transition-all border-none active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t('მიმდინარეობს დაკავშირება...', 'Connecting...') : 'Google Account Connect'}
              </button>
            </div>
          )}
        </div>

        {/* Credentials Form (Real API mode) */}
        {!integrations.demoMode && (
          <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-4">
            <h3 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
              <Key size={18} className="text-primary-fixed-dim" />
              API Credentials
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant">
              {t('შეიყვანეთ Google Cloud პროექტის რეკვიზიტები. სერთიფიკატები ინახება მხოლოდ თქვენს ბრაუზერში.', 'Enter Google Cloud project credentials. Certificates are saved only in your browser.')}
            </p>

            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">Google Client ID</label>
              <input 
                type="text" 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                placeholder="xxxxx.apps.googleusercontent.com" 
                value={integrations.clientId} 
                onChange={e => handleInputChange('clientId', e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">Google API Key</label>
              <input 
                type="password" 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                placeholder="AIzaSy..." 
                value={integrations.apiKey} 
                onChange={e => handleInputChange('apiKey', e.target.value)} 
              />
            </div>

            <div className="flex items-center gap-3 bg-primary-fixed/5 border border-primary-fixed/10 p-3.5 rounded-xl mt-2">
              <Settings size={16} className="text-primary-fixed-dim flex-shrink-0" />
              <span className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                {t('მიუთითეთ `https://nine13.site` Authorized Redirect URIs-ში.', 'Specify `https://nine13.site` in Authorized Redirect URIs.')}
              </span>
            </div>
          </div>
        )}

        {/* Permissions & Scopes */}
        <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <h3 className="font-headline-md text-lg font-bold text-on-surface">Permissions & Scopes</h3>
          <p className="font-body-md text-xs text-on-surface-variant">{t('მართეთ წვდომის უფლებები ნებისმიერ დროს', 'Manage access permissions at any time')}</p>
          
          <div className="flex flex-col gap-3 mt-2">
            {/* Calendar scope */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-primary-fixed-dim" />
                <div>
                  <div className="font-headline-md text-xs font-bold text-on-surface">Google Calendar Access</div>
                  <div className="font-body-md text-[10px] text-on-surface-variant">{t('სინქრონიზაცია და Meet ლინკების გენერირება', 'Sync and generate Meet links')}</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-outline bg-transparent text-primary-fixed-dim focus:ring-primary-fixed-dim cursor-pointer"
                checked={integrations.permissions.calendar} 
                onChange={() => togglePermission('calendar')}
              />
            </div>

            {/* Gmail scope */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-secondary-fixed-dim" />
                <div>
                  <div className="font-headline-md text-xs font-bold text-on-surface">Gmail Send Access</div>
                  <div className="font-body-md text-[10px] text-on-surface-variant">{t('მოწვევის წერილების ავტომატური გაგზავნა', 'Send invitation emails automatically')}</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-outline bg-transparent text-primary-fixed-dim focus:ring-primary-fixed-dim cursor-pointer"
                checked={integrations.permissions.gmail} 
                onChange={() => togglePermission('gmail')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mock OAuth Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-8 flex flex-col gap-6 border border-outline-variant/20 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/10">
              <Globe size={22} className="text-primary-fixed-dim" />
              <span className="font-headline-md text-base font-bold text-on-surface">Sign in with Google</span>
            </div>
            
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Productivity Tracker</strong> {t('ითხოვს ნებართვას თქვენს Google ანგარიშთან დასაკავშირებლად:', 'requests permission to connect to your Google Account:')}
            </p>

            <div className="flex flex-col gap-3 p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl">
              <div className="flex gap-3 text-[11px] text-on-surface-variant leading-normal">
                <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                <span>{t('თქვენი ძირითადი პროფილის ინფორმაციის ნახვა (სახელი, მეილი, ფოტო).', 'View your basic profile info (name, email, photo).')}</span>
              </div>
              {integrations.permissions.calendar && (
                <div className="flex gap-3 text-[11px] text-on-surface-variant leading-normal">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  <span>{t('Google Calendar-ში ივენთების დამატება, რედაქტირება და წაშლა.', 'Add, edit, and delete events in Google Calendar.')}</span>
                </div>
              )}
              {integrations.permissions.gmail && (
                <div className="flex gap-3 text-[11px] text-on-surface-variant leading-normal">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  <span>{t('Gmail-ის მეშვეობით შეხვედრის მოწვევების გაგზავნა მონაწილეებისთვის.', 'Send meeting invitations to participants via Gmail.')}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConsentModal(false)} 
                className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border border-outline-variant/30 active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleApproveConsent} 
                className="flex-1 bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border-none active:scale-95"
              >
                Allow Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
