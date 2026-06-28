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
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      <header className="flex flex-col gap-2">
        <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('შეხვედრები & Google Meet', 'Meetings & Google Meet')}</h2>
        <p className="font-body-md text-on-surface-variant">{t('დაგეგმეთ შეხვედრები, დააგენერირეთ Google Meet ბმულები და გაუგზავნეთ მოწვევები მონაწილეებს', 'Schedule meetings, generate Google Meet links, and send invitations to participants')}</p>
      </header>

      {successMsg && (
        <div className="bg-green-400/10 border border-green-400/20 text-green-400 p-4 rounded-xl flex items-center gap-3 font-semibold">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Warning if Google is not connected */}
      {!integrations.connected && (
        <div className="bg-amber-400/10 border border-amber-400/20 text-amber-400 p-5 rounded-xl flex items-start gap-4 text-xs leading-relaxed">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-headline-md text-sm font-bold block mb-1">{t('Google ანგარიში არ არის დაკავშირებული!', 'Google account is not connected!')}</strong>
            <p className="text-on-surface-variant/80">
              {t("ავტომატური Google Meet ბმულების შესაქმნელად და მონაწილეებისთვის მოწვევების გასაგზავნად, ჯერ დააკავშირეთ თქვენი Google ანგარიში **Google ინტეგრაციის** გვერდიდან. ახლა შეხვედრები შეიქმნება ლოკალურად.", "To automatically generate Google Meet links and send invitations to participants, please connect your Google account from the **Google Integration** page first. For now, meetings will be created locally.")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Meeting Form */}
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <Plus size={20} className="text-primary-fixed-dim" />
            {t('შეხვედრის დაგეგმვა', 'Schedule Meeting')}
          </h3>

          <form onSubmit={handleCreateMeeting} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('სათაური', 'Title')}</label>
              <input 
                type="text" 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                placeholder={t("მაგ: პროექტის განხილვა", "e.g. Project Discussion")} 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('აღწერა (Description)', 'Description')}</label>
              <textarea 
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                placeholder={t("შეხვედრის დღის წესრიგი...", "Meeting agenda...")} 
                rows="3"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('თარიღი', 'Date')}</label>
                <input 
                  type="date" 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer"
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('დრო', 'Time')}</label>
                <input 
                  type="time" 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer"
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Participants manager */}
            <div className="flex flex-col gap-2">
              <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('მონაწილეები (ელ-ფოსტა)', 'Participants (Email)')}</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors"
                  placeholder="participants@example.com" 
                  value={participantInput} 
                  onChange={e => setParticipantInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                />
                <button 
                  type="button" 
                  onClick={handleAddParticipant} 
                  className="bg-surface-container-high hover:bg-surface-bright text-on-surface p-3 rounded-xl border border-outline-variant/30 flex items-center justify-center transition-all cursor-pointer"
                >
                  <UserPlus size={16} />
                </button>
              </div>

              {/* Render participants list */}
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {participants.map(p => (
                    <span 
                      key={p} 
                      className="font-label text-[10px] bg-surface-container-high border border-outline-variant/20 px-2.5 py-1 rounded-full text-on-surface flex items-center gap-1.5"
                    >
                      {p}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveParticipant(p)}
                        className="text-error font-bold hover:scale-110 transition-transform cursor-pointer bg-transparent border-none p-0 text-[10px]"
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
              <div className="bg-primary-fixed/5 border border-primary-fixed/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="font-label text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider mb-1">
                  Smart Google Automation
                </div>
                
                {/* Sync to calendar */}
                <label className="flex items-center gap-2.5 cursor-pointer font-body-md text-xs text-on-surface-variant">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-outline bg-transparent text-primary-fixed-dim focus:ring-primary-fixed-dim cursor-pointer"
                    checked={syncToCalendar} 
                    onChange={e => setSyncToCalendar(e.target.checked)}
                  />
                  <span>Create Google Calendar Event</span>
                </label>

                {/* Create Meet link */}
                <label className="flex items-center gap-2.5 cursor-pointer font-body-md text-xs text-on-surface-variant">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-outline bg-transparent text-primary-fixed-dim focus:ring-primary-fixed-dim cursor-pointer"
                    checked={createMeetLink} 
                    onChange={e => setCreateMeetLink(e.target.checked)}
                  />
                  <span>Generate Google Meet Link</span>
                </label>

                {/* Send invites */}
                <label className={`flex items-center gap-2.5 cursor-pointer font-body-md text-xs text-on-surface-variant ${participants.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-outline bg-transparent text-primary-fixed-dim focus:ring-primary-fixed-dim cursor-pointer"
                    checked={sendGmailInvites} 
                    disabled={participants.length === 0}
                    onChange={e => setSendGmailInvites(e.target.checked)}
                  />
                  <span>Send Email Invitations (via Gmail)</span>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-sm py-3 px-6 rounded-full cursor-pointer transition-all border-none flex items-center justify-center gap-2 active:scale-95 mt-2"
            >
              <Video size={16} />
              <span>{loading ? t('მიმდინარეობს შექმნა...', 'Creating...') : t('შეხვედრის დაგეგმვა', 'Schedule Meeting')}</span>
            </button>
          </form>
        </div>

        {/* Scheduled Meetings List */}
        <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col min-h-[500px]">
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <Users size={20} className="text-secondary-fixed-dim" />
            {t('დაგეგმილი შეხვედრები', 'Scheduled Meetings')} ({meetings.length})
          </h3>

          {meetings.length > 0 ? (
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
              {meetings.map(meeting => (
                <div 
                  key={meeting.id} 
                  className="p-5 bg-surface-container-low border border-outline-variant/10 hover:border-primary-fixed-dim/20 transition-all rounded-xl relative group"
                >
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none p-1 transition-colors opacity-70 hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>

                  <h4 className="font-headline-md text-base font-bold text-on-surface mb-2 pr-6">{meeting.title}</h4>
                  
                  {meeting.description && (
                    <p className="font-body-md text-xs text-on-surface-variant mb-4 leading-relaxed">{meeting.description}</p>
                  )}

                  {/* Metadata: Date and Time */}
                  <div className="flex gap-4 text-on-surface-variant/70 font-label text-[10px] mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary-fixed-dim" />
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-primary-fixed-dim" />
                      {meeting.time}
                    </span>
                  </div>

                  {/* Attendees */}
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div className="mb-4">
                      <span className="font-body-md text-xs font-semibold text-on-surface-variant block mb-1.5">
                        {t('მონაწილეები (', 'Participants (')}{meeting.participants.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.participants.map(p => (
                          <span key={p} className="font-label text-[9px] bg-surface-container-highest border border-outline-variant/20 px-2 py-0.5 rounded text-on-surface-variant">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Integration Status Flags */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {meeting.googleSynced && (
                      <span className="font-label text-[9px] px-2 py-0.5 rounded bg-primary-fixed/10 text-primary-fixed-dim font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Calendar Synced
                      </span>
                    )}
                    {meeting.gmailSent && (
                      <span className="font-label text-[9px] px-2 py-0.5 rounded bg-sky-400/10 text-sky-400 font-bold flex items-center gap-1">
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
                      className="w-full bg-primary-fixed/5 hover:bg-primary-fixed/10 border border-primary-fixed/20 hover:border-primary-fixed/30 text-primary-fixed-dim font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-center"
                    >
                      <Video size={14} />
                      <span>{t('Google Meet-ზე შესვლა', 'Join Google Meet')}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <div className="font-body-md text-xs text-on-surface-variant/50 bg-surface-container-high/40 py-2.5 px-4 rounded-xl text-center border border-dashed border-outline-variant/10">
                      {t('შეხვედრის ონლაინ ბმული არ არის დაგენერირებული', 'Online meeting link is not generated')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant text-sm py-12">
              {t('დაგეგმილი შეხვედრები არ მოიძებნა.', 'No scheduled meetings found.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
