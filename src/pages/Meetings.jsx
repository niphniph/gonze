import { useState } from 'react';
import { db } from '../utils/db';
import { googleService } from '../services/googleService';
import { GlassCard } from '../components/GlassCard';
import { 
  Video, 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  UserPlus
} from 'lucide-react';

const generateMeetingId = () => `m-${Date.now()}`;

export const Meetings = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [meetings, setMeetings] = useState(() => db.getMeetings() || []);
  const [integrations] = useState(() => db.getIntegrations());
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-06-12');
  const [time, setTime] = useState('14:00');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState([]);
  
  // Toggle States
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [createMeetLink, setCreateMeetLink] = useState(true);
  const [sendGmailInvites, setSendGmailInvites] = useState(true);
 
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const saveMeetings = (updated) => {
    setMeetings(updated);
    db.saveMeetings(updated);
    
    // Also sync to calendar events store if toggled
    if (syncToCalendar) {
      const calendarEvents = db.getCalendarEvents();
      // Filter out existing meetings events
      const filtered = calendarEvents.filter(e => e.type !== 'meeting');
      // Map current meetings to calendar events
      const meetingEvents = updated.map(m => ({
        id: `cal-m-${m.id}`,
        title: `${language === 'ka' ? 'შეხვედრა: ' : 'Meeting: '}${m.title}`,
        description: m.description,
        date: m.date,
        time: m.time,
        type: 'meeting',
        color: 'hsl(var(--accent-blue))',
        meetLink: m.meetLink,
        participants: m.participants
      }));
      db.saveCalendarEvents([...filtered, ...meetingEvents]);
    }
  };

  const handleAddParticipant = () => {
    const email = participantInput.trim();
    if (!email) return;
    // Simple email regex check
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert(t("გთხოვთ შეიყვანოთ სწორი ელ-ფოსტის მისამართი.", "Please enter a valid email address."));
      return;
    }
    if (participants.includes(email)) return;
    setParticipants([...participants, email]);
    setParticipantInput('');
  };

  const handleRemoveParticipant = (email) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);

    try {
      let meetLink = "";
      let isSynced = false;
      let isGmailSent = false;
      let googleEventId = "";

      // Handle Google integration features via googleService
      if (integrations.connected) {
        if (syncToCalendar) {
          try {
            const res = await googleService.createCalendarEvent({
              title: title.trim(),
              description: description.trim(),
              date,
              time,
              attendees: participants
            });
            if (res.success) {
              meetLink = res.meetLink;
              googleEventId = res.id;
              isSynced = true;
            }
          } catch (calError) {
            console.error("Failed to sync calendar event:", calError);
            alert(t("Google კალენდართან სინქრონიზაციის შეცდომა: ", "Google Calendar sync error: ") + calError.message);
          }
        }

        if (isSynced && sendGmailInvites && participants.length > 0) {
          try {
            const subject = `${t('მოწვევა შეხვედრაზე: ', 'Meeting Invitation: ')}${title.trim()}`;
            const body = `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>${title.trim()}</h2>
                <p>${description.trim() || t('დამატებითი აღწერის გარეშე.', 'No additional description.')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>${t('თარიღი:', 'Date:')}</strong> ${date}</p>
                <p><strong>${t('დრო:', 'Time:')}</strong> ${time}</p>
                ${meetLink ? `<p><strong>Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <small style="color: #666;">Sent automatically via Productivity Tracker</small>
              </div>
            `;
            
            // Send to all participants
            await Promise.all(
              participants.map(email => googleService.sendGmailInvitation({ to: email, subject, body }))
            );
            isGmailSent = true;
          } catch (gmailError) {
            console.error("Failed to send invitations via Gmail:", gmailError);
            alert(t("Gmail-ით მოწვევის გაგზავნის შეცდომა: ", "Gmail invitation send error: ") + gmailError.message);
          }
        }
      }

      const newMeeting = {
        id: generateMeetingId(),
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        participants,
        meetLink,
        googleEventId,
        googleSynced: isSynced,
        gmailSent: isGmailSent,
        createdAt: new Date().toISOString()
      };

      const updated = [newMeeting, ...meetings];
      saveMeetings(updated);
      
      // Reset Form
      setTitle('');
      setDescription('');
      setParticipants([]);
      setParticipantInput('');

      let feedback = t("შეხვედრა წარმატებით შეიქმნა!", "Meeting created successfully!");
      if (meetLink) feedback += t(" Google Meet ბმული დაგენერირდა.", " Google Meet link generated.");
      if (isGmailSent) feedback += t(" მოწვევები გაიგზავნა Gmail-ით.", " Invitations sent via Gmail.");
      
      setSuccessMsg(feedback);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(t("შეხვედრის შექმნის შეცდომა: ", "Meeting creation error: ") + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = (id) => {
    if (window.confirm(t("დარწმუნებული ხართ, რომ გსურთ შეხვედრის წაშლა?", "Are you sure you want to delete this meeting?"))) {
      const updated = meetings.filter(m => m.id !== id);
      saveMeetings(updated);
    }
  };

  return (
    <div className="meetings-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('შეხვედრები & Google Meet', 'Meetings & Google Meet')}</h1>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('დაგეგმეთ შეხვედრები, დააგენერირეთ Google Meet ბმულები და გაუგზავნეთ მოწვევები მონაწილეებს', 'Schedule meetings, generate Google Meet links, and send invitations to participants')}</p>
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

      {/* Warning if Google is not connected */}
      {!integrations.connected && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid hsl(var(--accent-amber))',
          color: 'hsl(var(--accent-amber))',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong>{t('Google ანგარიში არ არის დაკავშირებული!', 'Google account is not connected!')}</strong>
            <p style={{ marginTop: '0.25rem', color: 'rgba(245, 158, 11, 0.8)' }}>
              {t("ავტომატური Google Meet ბმულების შესაქმნელად და მონაწილეებისთვის მოწვევების გასაგზავნად, ჯერ დააკავშირეთ თქვენი Google ანგარიში **Google ინტეგრაციის** გვერდიდან. ახლა შეხვედრები შეიქმნება ლოკალურად.", "To automatically generate Google Meet links and send invitations to participants, please connect your Google account from the **Google Integration** page first. For now, meetings will be created locally.")}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Create Meeting Form */}
        <GlassCard>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} style={{ color: 'hsl(var(--primary))' }} />
            {t('შეხვედრის დაგეგმვა', 'Schedule Meeting')}
          </h3>

          <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('სათაური', 'Title')}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t("მაგ: პროექტის განხილვა", "e.g. Project Discussion")} 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('აღწერა (Description)', 'Description')}</label>
              <textarea 
                className="form-textarea" 
                placeholder={t("შეხვედრის დღის წესრიგი...", "Meeting agenda...")} 
                rows="3"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('თარიღი', 'Date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('დრო', 'Time')}</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Participants manager */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('მონაწილეები (ელ-ფოსტა)', 'Participants (Email)')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="participants@example.com" 
                  value={participantInput} 
                  onChange={e => setParticipantInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                />
                <button 
                  type="button" 
                  onClick={handleAddParticipant} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.625rem' }}
                >
                  <UserPlus size={16} />
                </button>
              </div>

              {/* Render participants list */}
              {participants.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {participants.map(p => (
                    <span 
                      key={p} 
                      style={{ 
                        fontSize: '0.75rem', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        border: '1px solid var(--border-light)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {p}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveParticipant(p)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-rose))', fontWeight: 'bold', fontSize: '0.7rem' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Google Automation Toggles */}
            {integrations.connected && (
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.03)', 
                border: '1px solid rgba(139, 92, 246, 0.1)', 
                borderRadius: '10px', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--primary-hover))', marginBottom: '0.25rem' }}>
                  Smart Google Automation
                </div>
                
                {/* Sync to calendar */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <input 
                    type="checkbox" 
                    checked={syncToCalendar} 
                    onChange={e => setSyncToCalendar(e.target.checked)}
                    style={{ accentColor: 'hsl(var(--primary))' }}
                  />
                  <span>Create Google Calendar Event</span>
                </label>

                {/* Create Meet link */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <input 
                    type="checkbox" 
                    checked={createMeetLink} 
                    onChange={e => setCreateMeetLink(e.target.checked)}
                    style={{ accentColor: 'hsl(var(--primary))' }}
                  />
                  <span>Generate Google Meet Link</span>
                </label>

                {/* Send invites */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.8rem', opacity: participants.length === 0 ? 0.5 : 1 }}>
                  <input 
                    type="checkbox" 
                    checked={sendGmailInvites} 
                    disabled={participants.length === 0}
                    onChange={e => setSendGmailInvites(e.target.checked)}
                    style={{ accentColor: 'hsl(var(--primary))' }}
                  />
                  <span>Send Email Invitations (via Gmail)</span>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              <Video size={16} />
              <span>{loading ? t('მიმდინარეობს შექმნა...', 'Creating...') : t('შეხვედრის დაგეგმვა', 'Schedule Meeting')}</span>
            </button>
          </form>
        </GlassCard>

        {/* Scheduled Meetings List */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} style={{ color: 'hsl(var(--accent-blue))' }} />
            {t('დაგეგმილი შეხვედრები', 'Scheduled Meetings')} ({meetings.length})
          </h3>

          {meetings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '500px', paddingRight: '0.25rem' }}>
              {meetings.map(meeting => (
                <div 
                  key={meeting.id} 
                  style={{ 
                    padding: '1.25rem', 
                    background: 'rgba(255, 255, 255, 0.01)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      right: '1rem', 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: 'hsl(var(--accent-rose))',
                      opacity: 0.7
                    }}
                  >
                    <Trash2 size={16} />
                  </button>

                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', paddingRight: '1.5rem' }}>{meeting.title}</h4>
                  
                  {meeting.description && (
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', marginBottom: '1rem' }}>{meeting.description}</p>
                  )}

                  {/* Metadata: Date and Time */}
                  <div style={{ display: 'flex', gap: '1rem', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      {meeting.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {meeting.time}
                    </span>
                  </div>

                  {/* Attendees */}
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '0.25rem' }}>
                        {t('მონაწილეები (', 'Participants (')}{meeting.participants.length}):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {meeting.participants.map(p => (
                          <span key={p} style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'hsl(var(--text-secondary))' }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Integration Status Flags */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {meeting.googleSynced && (
                      <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.1)', color: 'hsl(var(--primary-hover))', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2' }}>
                        <CheckCircle2 size={10} />
                        Calendar Synced
                      </span>
                    )}
                    {meeting.gmailSent && (
                      <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.1)', color: 'hsl(var(--accent-blue))', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2' }}>
                        <Mail size={10} />
                        Invites Sent
                      </span>
                    )}
                  </div>

                  {/* Join Link */}
                  {meeting.meetLink ? (
                    <a 
                      href={meeting.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        fontSize: '0.8rem', 
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: 'hsl(var(--primary-hover))',
                        boxShadow: 'none'
                      }}
                    >
                      <Video size={14} />
                      <span>{t('Google Meet-ზე შესვლა', 'Join Google Meet')}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'hsl(var(--text-muted))', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      padding: '0.5rem', 
                      borderRadius: '8px', 
                      textAlign: 'center',
                      border: '1px dashed var(--border-light)' 
                    }}>
                      {t('შეხვედრის ონლაინ ბმული არ არის დაგენერირებული', 'Online meeting link is not generated')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: 'hsl(var(--text-muted))' }}>
              {t('დაგეგმილი შეხვედრები არ მოიძებნა.', 'No scheduled meetings found.')}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
