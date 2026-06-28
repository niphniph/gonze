import { useState, useCallback } from 'react';
import { db } from '../utils/db';
import { googleService } from '../services/googleService';
import { GlassCard } from '../components/GlassCard';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  CheckSquare, 
  RefreshCw,
  Clock,
  Link,
  UserPlus
} from 'lucide-react';

const getInitialEvents = (lang) => {
  const localTasks = db.getTasks() || [];
  const localMeetings = db.getMeetings() || [];
  const localCalEvents = db.getCalendarEvents() || [];

  const translateCategoryLocal = (cat) => {
    if (!cat) return '';
    if (lang === 'ka') return cat;
    if (cat.includes('ჯანმრთელობა')) return 'Health 💪🏻';
    if (cat.includes('სამსახური')) return 'Work 💼';
    if (cat.includes('ფული')) return 'Money ₿';
    if (cat.includes('ოჯახი')) return 'Family 👨‍👩‍👧‍👦';
    if (cat.includes('განვითარება')) return 'Personal Development 📚';
    if (cat.includes('საქმეები')) return 'Chores 🧹';
    if (cat.includes('იდეები')) return 'Ideas 💡';
    if (cat.includes('დასვენება')) return 'Leisure 🎮';
    if (cat.includes('სულიერება')) return 'Spirituality 🧘🏻';
    if (cat.includes('საჭმელი')) return 'Food 🍔';
    if (cat.includes('ქირა')) return 'Rent 🏠';
    if (cat.includes('კომუნალური')) return 'Utilities ⚡';
    if (cat.includes('ტრანსპორტი')) return 'Transport 🚗';
    if (cat.includes('გართობა')) return 'Entertainment 🎭';
    if (cat.includes('შოპინგი')) return 'Shopping 🛍️';
    if (cat.includes('სზვა ხარჯი') || cat.includes('სხვა ხარჯი')) return 'Other Expense 💸';
    return cat;
  };

  const taskEvents = localTasks.map(t => ({
    id: `task-${t.id}`,
    title: `${lang === 'ka' ? 'დავალება: ' : 'Task: '}${t.text || t.name}`,
    description: translateCategoryLocal(t.category) || (lang === 'ka' ? "დავალება" : "Task"),
    date: t.date || "2026-06-12",
    time: "23:59",
    type: 'task',
    color: 'hsl(var(--primary))',
    completed: t.completed
  }));

  const meetingEvents = localMeetings.map(m => ({
    id: `meet-${m.id}`,
    title: `${lang === 'ka' ? 'შეხვედრა: ' : 'Meeting: '}${m.title}`,
    description: m.description,
    date: m.date,
    time: m.time,
    type: 'meeting',
    color: 'hsl(var(--accent-blue))',
    meetLink: m.meetLink,
    participants: m.participants
  }));

  const customEvents = localCalEvents.map(e => ({
    ...e,
    color: e.color || 'hsl(var(--accent-emerald))'
  }));

  return [...taskEvents, ...meetingEvents, ...customEvents];
};

export const CalendarPage = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 12)); // June 12, 2026 (local month is 0-indexed: 5 = June)
  const [events, setEvents] = useState(() => getInitialEvents(language));
  const [integrations] = useState(() => db.getIntegrations());
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // New Event Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('event'); // 'event' or 'task'
  const [formDate, setFormDate] = useState('2026-06-12');
  const [formTime, setFormTime] = useState('12:00');
  const [formDesc, setFormDesc] = useState('');

  // Google Integration states
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [sendInvites, setSendInvites] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantInput, setParticipantInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  const loadEvents = useCallback(() => {
    setEvents(getInitialEvents(language));
  }, [language]);

  const [prevLanguage, setPrevLanguage] = useState(language);
  if (language !== prevLanguage) {
    setPrevLanguage(language);
    setEvents(getInitialEvents(language));
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSyncGoogle = () => {
    if (!integrations.connected) {
      alert(t("გთხოვთ დაუკავშიროთ Google ანგარიში 'ინტეგრაციები' გვერდიდან კალენდრის სინქრონიზაციისთვის.", "Please connect Google account from the Integrations page to sync calendar."));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      
      // Seed some mock google calendar events
      const mockGoogleEvents = [
        {
          id: `google-1`,
          title: "Google Sync: Quarter Report",
          description: "Sync project board with teammates",
          date: "2026-06-15",
          time: "10:30",
          type: 'google_event',
          color: 'hsl(var(--accent-amber))',
          googleSynced: true
        },
        {
          id: `google-2`,
          title: "Google Sync: Doctor consultation",
          description: "Dentist checkup appointment",
          date: "2026-06-18",
          time: "15:00",
          type: 'google_event',
          color: 'hsl(var(--accent-amber))',
          googleSynced: true
        }
      ];

      const currentCustom = db.getCalendarEvents() || [];
      // Prevent duplicates by checking ids
      const filteredCustom = currentCustom.filter(e => !e.id.startsWith('google-'));
      db.saveCalendarEvents([...filteredCustom, ...mockGoogleEvents]);
      loadEvents();
      alert(t("Google კალენდარი წარმატებით სინქრონიზდა!", "Google Calendar synced successfully!"));
    }, 1500);
  };

  const handleAddParticipant = () => {
    const email = participantInput.trim();
    if (!email) return;
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

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!formTitle) return;

    setSyncLoading(true);
    let meetLink = "";
    let isSynced = false;
    let googleEventId = "";

    if (integrations.connected && syncToGoogle) {
      try {
        const res = await googleService.createCalendarEvent({
          title: formTitle.trim(),
          description: formDesc.trim(),
          date: formDate,
          time: formTime,
          attendees: participants
        });
        if (res.success) {
          meetLink = res.meetLink;
          googleEventId = res.id;
          isSynced = true;

          if (sendInvites && participants.length > 0) {
            const subject = `${t('მოწვევა შეხვედრაზე: ', 'Meeting Invitation: ')}${formTitle.trim()}`;
            const body = `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>${formTitle.trim()}</h2>
                <p>${formDesc.trim() || t('დამატებითი აღწერის გარეშე.', 'No additional description.')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>${t('თარიღი:', 'Date:')}</strong> ${formDate}</p>
                <p><strong>${t('დრო:', 'Time:')}</strong> ${formTime}</p>
                ${meetLink ? `<p><strong>Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <small style="color: #666;">Sent automatically via Productivity Tracker</small>
              </div>
            `;
            await Promise.all(
              participants.map(email => googleService.sendGmailInvitation({ to: email, subject, body }))
            );
          }
        }
      } catch (err) {
        console.error("Google Calendar / Gmail error for event:", err);
        alert(t("Google კალენდართან სინქრონიზაციის შეცდომა: ", "Google Calendar sync error: ") + err.message);
      }
    }

    const newEvent = {
      id: `cal-custom-${Date.now()}`,
      title: formTitle,
      description: formDesc,
      date: formDate,
      time: formTime,
      type: formType,
      color: formType === 'task' ? 'hsl(var(--primary))' : 'hsl(var(--accent-emerald))',
      googleSynced: isSynced,
      googleEventId,
      meetLink,
      participants
    };

    const currentCustom = db.getCalendarEvents() || [];
    db.saveCalendarEvents([...currentCustom, newEvent]);
    loadEvents();
    
    // Reset Form & Close Modal
    setFormTitle('');
    setFormDesc('');
    setSyncToGoogle(false);
    setSendInvites(false);
    setParticipants([]);
    setParticipantInput('');
    setSyncLoading(false);
    setShowFormModal(false);
  };

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesKa = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNames = language === 'ka' ? monthNamesKa : monthNamesEn;

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  // Convert Sunday (0) to index 6, Monday (1) to 0 etc.
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysGrid = [];
  
  // Fill previous month trailing days
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(prevMonthTotalDays - i).padStart(2, '0')}`
    });
  }

  // Fill current month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  // Fill next month leading days
  const remainingSlots = 42 - daysGrid.length; // standard 6 rows * 7 columns = 42 grid
  for (let i = 1; i <= remainingSlots; i++) {
    daysGrid.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  const getEventsForDate = (dateString) => {
    return events.filter(e => e.date === dateString);
  };

  const daysOfWeek = language === 'ka' 
    ? ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('კალენდარი', 'Calendar')}</h2>
          <p className="font-body-md text-on-surface-variant">{t('დავალებები, შეხვედრები და კალენდრის ივენთები ერთიან სივრცეში', 'Tasks, meetings, and calendar events in one unified space')}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSyncGoogle} disabled={loading} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-2 border border-outline-variant/30">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? t('მიმდინარეობს სინქრონიზაცია...', 'Syncing...') : 'Google Sync'}</span>
          </button>
          <button onClick={() => setShowFormModal(true)} className="bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer transition-all active:scale-95 flex items-center gap-2 border-none">
            <Plus size={16} />
            <span>{t('ივენთის დამატება', 'Add Event')}</span>
          </button>
        </div>
      </header>

      {/* Calendar Header Switcher */}
      <GlassCard className="p-4 md:px-6 flex justify-between items-center rounded-2xl mb-6">
        <h3 className="font-headline-md text-lg font-extrabold text-on-surface capitalize">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold p-2 rounded-xl cursor-pointer transition-all border border-outline-variant/30 active:scale-95 flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date(2026, 5, 12))} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold py-2 px-4 rounded-xl cursor-pointer transition-all border border-outline-variant/30 active:scale-95 text-xs">
            {t('დღეს', 'Today')}
          </button>
          <button onClick={handleNextMonth} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold p-2 rounded-xl cursor-pointer transition-all border border-outline-variant/30 active:scale-95 flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>
      </GlassCard>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-outline-variant/10 rounded-2xl overflow-hidden border border-outline-variant/10 shadow-2xl">
        {/* Days of Week */}
        {daysOfWeek.map(day => (
          <div key={day} className="bg-surface-container-highest/60 py-3 text-center font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/10">
            {day}
          </div>
        ))}

        {/* Days cells */}
        {daysGrid.map((cell, index) => {
          const dateEvents = getEventsForDate(cell.dateString);
          const isToday = cell.dateString === '2026-06-12';
          
          return (
            <div 
              key={index} 
              className={`min-h-[110px] p-2.5 flex flex-col relative border-b border-r border-outline-variant/10 transition-all hover:bg-surface-container-low/20 ${
                cell.isCurrentMonth 
                  ? 'bg-surface-container-low/30' 
                  : 'bg-surface-container-lowest/10 opacity-30'
              }`}
            >
              {/* Day Number */}
              <span className={`font-headline-md text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mb-2 ${
                isToday 
                  ? 'bg-primary-fixed text-on-primary-fixed' 
                  : 'text-on-surface-variant'
              }`}>
                {cell.day}
              </span>

              {/* Render Events */}
              <div className="flex flex-col gap-1 overflow-hidden flex-1">
                {dateEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => setSelectedEvent(event)}
                    className={`text-[10px] py-1 px-1.5 rounded border border-outline-variant/10 truncate cursor-pointer font-semibold flex items-center gap-1 transition-all hover:brightness-110 active:scale-95 ${
                      event.type === 'task' && event.completed 
                        ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                        : 'bg-surface-container-high text-on-surface'
                    }`}
                    style={{ borderLeft: `3px solid ${event.color}` }}
                  >
                    {event.type === 'meeting' && <Video size={10} style={{ color: 'hsl(var(--accent-blue))', flexShrink: 0 }} />}
                    {event.type === 'task' && <CheckSquare size={10} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />}
                    <span>{event.title}</span>
                  </div>
                ))}
                
                {dateEvents.length > 3 && (
                  <span className="font-label text-[9px] text-on-surface-variant/70 pl-1 mt-0.5">
                    +{dateEvents.length - 3} {t('სხვა...', 'more...')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-sm w-full p-6 md:p-8 flex flex-col gap-5 border border-outline-variant/20 shadow-2xl">
            <h3 
              className="font-headline-md text-base font-black border-l-4 pl-3"
              style={{ borderColor: selectedEvent.color }}
            >
              {selectedEvent.title}
            </h3>

            {selectedEvent.description && (
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                {selectedEvent.description}
              </p>
            )}

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Clock size={14} className="text-primary-fixed-dim" />
                <span>{t('თარიღი: ', 'Date: ')} <strong className="text-on-surface">{selectedEvent.date}</strong> {selectedEvent.time && ` | ${selectedEvent.time}`}</span>
              </div>

              {selectedEvent.meetLink && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Video size={14} className="text-primary-fixed-dim" />
                  <a href={selectedEvent.meetLink} target="_blank" rel="noopener noreferrer" className="text-primary-fixed-dim hover:underline flex items-center gap-1">
                    {t('Google Meet შეხვედრა', 'Google Meet Meeting')}
                    <Link size={10} />
                  </a>
                </div>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-on-surface">{t('მონაწილეები:', 'Participants:')}</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.participants.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 bg-surface-container-highest border border-outline-variant/10 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.googleSynced && (
                <div className="flex items-center gap-1 text-orange-400 font-semibold">
                  <Clock size={12} />
                  <span>{t('სინქრონიზებულია Google Calendar-თან', 'Synced with Google Calendar')}</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedEvent(null)} 
              className="w-full bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border-none active:scale-95 mt-2"
            >
              {t('დახურვა', 'Close')}
            </button>
          </div>
        </div>
      )}

      {/* Add Event Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-sm w-full p-6 md:p-8 flex flex-col gap-5 border border-outline-variant/20 shadow-2xl">
            <h3 className="font-headline-md text-base font-bold text-on-surface border-b border-outline-variant/10 pb-2">{t('ივენთის დამატება', 'Add Event')}</h3>

            <form onSubmit={handleAddEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('სათაური', 'Title')}</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                  placeholder={t("ივენთის დასახელება", "Event Title")} 
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('ტიპი', 'Type')}</label>
                <select 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors cursor-pointer" 
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                >
                  <option value="event" className="bg-surface-container-high">{t('ივენთი (Event)', 'Event')}</option>
                  <option value="task" className="bg-surface-container-high">{t('დავალება (Task)', 'Task')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('თარიღი', 'Date')}</label>
                  <input 
                    type="date" 
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('დრო', 'Time')}</label>
                  <input 
                    type="time" 
                    className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body-md text-xs font-semibold text-on-surface-variant">{t('აღწერა', 'Description')}</label>
                <textarea 
                  className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-xl px-4 py-3 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-colors" 
                  placeholder={t("დამატებითი დეტალები...", "Additional details...")} 
                  rows="2"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              {/* Google Integration options if connected */}
              {integrations.connected && (
                <div className="bg-primary-fixed/5 border border-primary-fixed/15 rounded-xl p-4 flex flex-col gap-3">
                  <div className="font-label text-[10px] font-bold uppercase tracking-wider text-primary-fixed-dim">
                    Smart Google Automation
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                      <input 
                        type="checkbox" 
                        checked={syncToGoogle} 
                        onChange={e => setSyncToGoogle(e.target.checked)}
                        className="accent-primary-fixed-dim"
                      />
                      <span>Create Google Calendar Event</span>
                    </label>

                    {syncToGoogle && (
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface pl-4">
                        <input 
                          type="checkbox" 
                          checked={sendInvites} 
                          onChange={e => setSendInvites(e.target.checked)}
                          className="accent-primary-fixed-dim"
                        />
                        <span>Send Email Invitation (via Gmail)</span>
                      </label>
                    )}
                  </div>

                  {/* Participants list for calendar event */}
                  {syncToGoogle && sendInvites && (
                    <div className="flex flex-col gap-2 pl-4">
                      <label className="font-body-md text-[10px] font-semibold text-on-surface-variant">
                        {t('მოწვეული მონაწილეები', 'Invited Participants (Email)')}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="email" 
                          className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim" 
                          placeholder="invitee@example.com" 
                          value={participantInput} 
                          onChange={e => setParticipantInput(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                        />
                        <button 
                          type="button" 
                          onClick={handleAddParticipant} 
                          className="bg-surface-container-highest hover:bg-surface-bright text-on-surface p-2.5 rounded-xl cursor-pointer border border-outline-variant/30 active:scale-95"
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>

                      {participants.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {participants.map(p => (
                            <span 
                              key={p} 
                              className="text-[10px] bg-surface-container-highest border border-outline-variant/10 px-2 py-0.5 rounded flex items-center gap-1.5 text-on-surface"
                            >
                              {p}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveParticipant(p)}
                                className="bg-transparent border-none cursor-pointer text-error text-[10px] p-0 font-bold"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)} 
                  className="flex-1 bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border border-outline-variant/30 active:scale-95"
                  disabled={syncLoading}
                >
                  {t('გაუქმება', 'Cancel')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary-fixed-dim text-on-primary-fixed hover:bg-primary-container font-semibold text-xs py-3 px-4 rounded-full cursor-pointer transition-all border-none active:scale-95"
                  disabled={syncLoading}
                >
                  {syncLoading ? t('მიმდინარეობს სინქრონიზაცია...', 'Syncing...') : t('დამატება', 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
