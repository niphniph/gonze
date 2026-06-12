import { db } from '../utils/db';

// Simple client-side token obfuscation for secure storage at rest
const encryptToken = (token) => {
  if (!token) return '';
  return btoa(token).split('').reverse().join('');
};

const decryptToken = (encrypted) => {
  if (!encrypted) return '';
  try {
    const reversed = encrypted.split('').reverse().join('');
    return atob(reversed);
  } catch (e) {
    console.error('Failed to decrypt token:', e);
    return '';
  }
};

let tokenClient = null;

// Dynamically load Google APIs in the browser
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const googleService = {
  // Initialize Google Identity Services SDK
  init: async (clientId) => {
    if (!clientId) return;
    try {
      await loadScript('https://accounts.google.com/gsi/client');
      if (window.google?.accounts?.oauth2) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send',
          callback: (response) => {
            if (response.error) {
              console.error('OAuth error:', response);
              return;
            }
            // Save token details
            const integrations = db.getIntegrations();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + response.expires_in * 1000).toISOString();
            
            googleService.fetchUserProfile(response.access_token).then((profile) => {
              const updated = {
                ...integrations,
                connected: true,
                access_token_encrypted: encryptToken(response.access_token),
                expires_at: expiresAt,
                profile: profile || {
                  name: 'Google User',
                  email: 'user@gmail.com',
                  avatar: ''
                }
              };
              db.saveIntegrations(updated);
              // Trigger reload or state change in application
              window.dispatchEvent(new Event('google-auth-success'));
            });
          },
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google GIS SDK:', error);
    }
  },

  // Fetch basic profile info using the access token
  fetchUserProfile: async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          name: data.name,
          email: data.email,
          avatar: data.picture
        };
      }
    } catch (e) {
      console.error('Error fetching Google user profile:', e);
    }
    return null;
  },

  // Trigger OAuth Consent Screen
  connect: async () => {
    const integrations = db.getIntegrations();
    
    // Sandbox Mode simulation
    if (integrations.demoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockProfile = {
            name: "Nikoloz Kapanadze",
            email: "ninekapanadze@gmail.com",
            avatar: "https://lh3.googleusercontent.com/a/ACg8ocLz3J-W9"
          };
          const updated = {
            ...integrations,
            connected: true,
            profile: mockProfile,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
          };
          db.saveIntegrations(updated);
          resolve(updated);
        }, 1000);
      });
    }

    // Production Mode real API
    if (!tokenClient) {
      await googleService.init(integrations.clientId);
    }

    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      throw new Error('Google SDK not loaded. Check client ID and network.');
    }
  },

  // Revoke token / Disconnect
  disconnect: async () => {
    const integrations = db.getIntegrations();
    const token = decryptToken(integrations.access_token_encrypted);
    
    if (token && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(token);
      } catch (e) {
        console.warn('Failed to revoke Google token remotely:', e);
      }
    }

    const updated = {
      ...integrations,
      connected: false,
      access_token_encrypted: '',
      expires_at: null,
      profile: null
    };
    db.saveIntegrations(updated);
    return updated;
  },

  // Get active access token, renewing/alerting if expired
  getAccessToken: () => {
    const integrations = db.getIntegrations();
    if (!integrations.connected) return null;
    
    if (integrations.demoMode) return 'sandbox-token';

    const expiresAt = integrations.expires_at ? new Date(integrations.expires_at) : null;
    if (expiresAt && new Date() > expiresAt) {
      console.warn('Google Access Token has expired.');
      return null;
    }

    return decryptToken(integrations.access_token_encrypted);
  },

  // Create Google Calendar Event (with Google Meet integration)
  createCalendarEvent: async (eventDetails) => {
    const token = googleService.getAccessToken();
    if (!token) {
      throw new Error('Google account is not connected or token has expired.');
    }

    const { title, description, date, time, durationMinutes = 60, timezone = 'Asia/Tbilisi', attendees = [] } = eventDetails;
    const integrations = db.getIntegrations();

    // Sandbox Fallback
    if (integrations.demoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const hash1 = Math.random().toString(36).substring(2, 5);
          const hash2 = Math.random().toString(36).substring(2, 6);
          const hash3 = Math.random().toString(36).substring(2, 5);
          const meetLink = `https://meet.google.com/${hash1}-${hash2}-${hash3}`;
          
          resolve({
            success: true,
            id: `mock-g-event-${Date.now()}`,
            meetLink,
            htmlLink: 'https://calendar.google.com'
          });
        }, 1000);
      });
    }

    // Real API Call
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    const payload = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: timezone
      },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `gonze-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Google Calendar API Error: ${errorMsg}`);
    }

    const data = await response.json();
    const meetLink = data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || '';

    return {
      success: true,
      id: data.id,
      meetLink,
      htmlLink: data.htmlLink
    };
  },

  // Send Gmail email
  sendGmailInvitation: async (emailDetails) => {
    const token = googleService.getAccessToken();
    if (!token) {
      throw new Error('Google account is not connected or token has expired.');
    }

    const { to, subject, body } = emailDetails;
    const integrations = db.getIntegrations();

    // Sandbox Fallback
    if (integrations.demoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, messageId: `mock-gmail-msg-${Date.now()}` });
        }, 1000);
      });
    }

    // Real Gmail Send MIME compile
    const makeMime = (toEmail, mailSubject, mailBody) => {
      const lines = [
        `To: ${toEmail}`,
        "Content-Type: text/html; charset=utf-8",
        "Mime-Version: 1.0",
        `Subject: ${mailSubject}`,
        "",
        mailBody
      ];
      return btoa(unescape(encodeURIComponent(lines.join("\r\n"))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const rawMime = makeMime(to, subject, body);
    
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawMime })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Gmail API Error: ${errorMsg}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id
    };
  }
};
