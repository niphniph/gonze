import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Key, 
  Settings 
} from 'lucide-react';

export const GoogleIntegrations = () => {
  const [integrations, setIntegrations] = useState({
    connected: false,
    demoMode: true,
    clientId: '',
    apiKey: '',
    permissions: { calendar: true, gmail: true },
    profile: null
  });

  const [loading, setLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setIntegrations(db.getIntegrations());
  }, []);

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

  const handleConnect = () => {
    if (!integrations.demoMode && (!integrations.clientId || !integrations.apiKey)) {
      alert("გთხოვთ შეიყვანოთ Client ID და API Key რეალურ რეჟიმში დასაკავშირებლად.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowConsentModal(true);
    }, 1200);
  };

  const handleApproveConsent = () => {
    setLoading(true);
    setShowConsentModal(false);
    setTimeout(() => {
      setLoading(false);
      const mockProfile = {
        name: "ნიკოლოზ კაპანაძე",
        email: "ninekapanadze@gmail.com",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocLz3J-W9" // mock profile picture
      };
      saveState({
        ...integrations,
        connected: true,
        profile: mockProfile
      });
      setSuccessMessage("Google-ის ანგარიში წარმატებით დაუკავშირდა!");
      setTimeout(() => setSuccessMessage(''), 4000);
    }, 1000);
  };

  const handleDisconnect = () => {
    if (window.confirm("დარწმუნებული ხართ, რომ გსურთ კავშირის გაწყვეტა?")) {
      saveState({
        ...integrations,
        connected: false,
        profile: null
      });
      setSuccessMessage("კავშირი გაწყვეტილია.");
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="google-integrations-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>ინტეგრაციები</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>დაუკავშირეთ Google სერვისები თქვენს პლატფორმას ავტომატური კალენდრისა და შეხვედრებისთვის</p>
      </header>

      {successMessage && (
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
          <span>{successMessage}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Connection panel */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Google Account Connection</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>სიმულაციის რეჟიმი</span>
              <button 
                onClick={toggleDemoMode} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--primary))' }}
              >
                {integrations.demoMode ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>
          </div>

          {integrations.connected && integrations.profile ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '1.5rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <img 
                src={integrations.profile.avatar} 
                alt="Avatar" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', border: '2px solid hsl(var(--primary))' }}
                onError={(e) => { e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
              />
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{integrations.profile.name}</h4>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{integrations.profile.email}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '999px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: 'hsl(var(--accent-emerald))', 
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <ShieldCheck size={12} />
                  Active Token
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '999px', 
                  background: integrations.demoMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(139, 92, 246, 0.1)', 
                  color: integrations.demoMode ? '#38bdf8' : 'hsl(var(--primary-hover))', 
                  fontWeight: 600
                }}>
                  {integrations.demoMode ? 'Sandbox Mode' : 'Production Mode'}
                </span>
              </div>

              <button onClick={handleDisconnect} className="btn btn-danger" style={{ width: '100%' }}>
                <Trash2 size={16} />
                <span>კავშირის გაწყვეტა (Disconnect)</span>
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '2rem 1.5rem', 
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.15)', 
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(139, 92, 246, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1rem',
                color: 'hsl(var(--primary))' 
              }}>
                <Globe size={32} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>დაუკავშირეთ Google ანგარიში</h4>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                მოახდინეთ კალენდრის სინქრონიზაცია და დააგენერირეთ Google Meet ბმულები თქვენი დავალებებისა და შეხვედრებისთვის.
              </p>
              
              <button 
                onClick={handleConnect} 
                disabled={loading}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {loading ? 'მიმდინარეობს დაკავშირება...' : 'Google Account Connect'}
              </button>
            </div>
          )}
        </GlassCard>

        {/* Credentials Form (Real API mode) */}
        {!integrations.demoMode && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} style={{ color: 'hsl(var(--primary))' }} />
              API Credentials Configuration
            </h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              შეიყვანეთ Google Cloud პროექტის რეკვიზიტები. სერთიფიკატები ინახება მხოლოდ თქვენს ბრაუზერში.
            </p>

            <div className="form-group">
              <label className="form-label">Google Client ID</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="xxxxx.apps.googleusercontent.com" 
                value={integrations.clientId} 
                onChange={e => handleInputChange('clientId', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Google API Key</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="AIzaSy..." 
                value={integrations.apiKey} 
                onChange={e => handleInputChange('apiKey', e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
              <Settings size={16} style={{ color: 'hsl(var(--primary))' }} />
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                მიუთითეთ `https://nine13.site` Authorized Redirect URIs-ში.
              </span>
            </div>
          </GlassCard>
        )}

        {/* Permissions & Scopes */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Active Scopes & Permissions</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>მართეთ წვდომის უფლებები ნებისმიერ დროს</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {/* Calendar scope */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0.75rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: 'hsl(var(--primary))' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Google Calendar Access</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>სინქრონიზაცია და Meet ლინკების გენერირება</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={integrations.permissions.calendar} 
                onChange={() => togglePermission('calendar')}
                style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
              />
            </div>

            {/* Gmail scope */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0.75rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={18} style={{ color: 'hsl(var(--accent-blue))' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Gmail Send Access</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>მოწვევის წერილების ავტომატური გაგზავნა</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={integrations.permissions.gmail} 
                onChange={() => togglePermission('gmail')}
                style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Mock OAuth Consent Modal */}
      {showConsentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--bg-surface-elevated))',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '450px',
            padding: '2rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Globe size={24} style={{ color: '#4285F4' }} />
              <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Sign in with Google</span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', marginBottom: '1rem', lineHeight: '1.4' }}>
              <strong>Gonze Tracker</strong> ითხოვს ნებართვას თქვენს Google ანგარიშთან დასაკავშირებლად:
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              padding: '1rem', 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                <CheckCircle2 size={16} style={{ color: 'hsl(var(--accent-emerald))', flexShrink: 0 }} />
                <span>თქვენი ძირითადი პროფილის ინფორმაციის ნახვა (სახელი, მეილი, ფოტო).</span>
              </div>
              {integrations.permissions.calendar && (
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                  <CheckCircle2 size={16} style={{ color: 'hsl(var(--accent-emerald))', flexShrink: 0 }} />
                  <span>Google Calendar-ში ივენთების დამატება, რედაქტირება და წაშლა.</span>
                </div>
              )}
              {integrations.permissions.gmail && (
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                  <CheckCircle2 size={16} style={{ color: 'hsl(var(--accent-emerald))', flexShrink: 0 }} />
                  <span>Gmail-ის მეშვეობით შეხვედრის მოწვევების გაგზავნა მონაწილეებისთვის.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowConsentModal(false)} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleApproveConsent} 
                className="btn btn-primary" 
                style={{ flex: 1, background: '#4285F4' }}
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
