import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  RefreshCw,
  Info,
  Clock,
  Link
} from 'lucide-react';

export const CalendarPage = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 12)); // June 12, 2026 (local month is 0-indexed: 5 = June)
  const [events, setEvents] = useState([]);
  const [integrations, setIntegrations] = useState({ connected: false });
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // New Event Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('event'); // 'event' or 'task'
  const [formDate, setFormDate] = useState('2026-06-12');
  const [formTime, setFormTime] = useState('12:00');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    loadEvents();
    setIntegrations(db.getIntegrations());
  }, []);

  const loadEvents = () => {
    const localTasks = db.getTasks() || [];
    const localMeetings = db.getMeetings() || [];
    const localCalEvents = db.getCalendarEvents() || [];

    // Map tasks to events
    const taskEvents = localTasks.map(t => ({
      id: `task-${t.id}`,
      title: `${language === 'ka' ? 'დავალება: ' : 'Task: '}${t.text || t.name}`,
      description: translateCategory(t.category) || (language === 'ka' ? "დავალება" : "Task"),
      date: t.date || "2026-06-12",
      time: "23:59",
      type: 'task',
      color: 'hsl(var(--primary))',
      completed: t.completed
    }));

    // Map meetings to events
    const meetingEvents = localMeetings.map(m => ({
      id: `meet-${m.id}`,
      title: `${language === 'ka' ? 'შეხვედრა: ' : 'Meeting: '}${m.title}`,
      description: m.description,
      date: m.date,
      time: m.time,
      type: 'meeting',
      color: 'hsl(var(--accent-blue))',
      meetLink: m.meetLink,
      participants: m.participants
    }));

    // Local custom calendar events
    const customEvents = localCalEvents.map(e => ({
      ...e,
      color: e.color || 'hsl(var(--accent-emerald))'
    }));

    setEvents([...taskEvents, ...meetingEvents, ...customEvents]);
  };

  const translateCategory = (cat) => {
    if (!cat) return '';
    if (language === 'ka') return cat;
    if (cat.includes('ჯანმრთელობა')) return 'Health 💪🏻';
    if (cat.includes('სამსახური')) return 'Work 💼';
    if (cat.includes('ფული')) return 'Money ₿';
    if (cat.includes('ოჯახი')) return 'Family 👨‍👩‍👧‍👦';
    if (cat.includes('განვითარება')) return 'Personal Development 📚';
    if (cat.includes('საქმეები')) return 'Chores 🧹';
    if (cat.includes('იდეები')) return 'Ideas 💡';
    if (cat.includes('დასვენება')) return 'Leisure 🎮';
    if (cat.includes('სულიერება')) return 'Spirituality 🧘🏻';
    return cat;
  };

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

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!formTitle) return;

    const newEvent = {
      id: `cal-custom-${Date.now()}`,
      title: formTitle,
      description: formDesc,
      date: formDate,
      time: formTime,
      type: formType,
      color: formType === 'task' ? 'hsl(var(--primary))' : 'hsl(var(--accent-emerald))',
      googleSynced: integrations.connected
    };

    const currentCustom = db.getCalendarEvents() || [];
    db.saveCalendarEvents([...currentCustom, newEvent]);
    loadEvents();
    
    // Reset Form & Close Modal
    setFormTitle('');
    setFormDesc('');
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
    <div className="calendar-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('კალენდარი', 'Calendar')}</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('დავალებები, შეხვედრები და კალენდრის ივენთები ერთიან სივრცეში', 'Tasks, meetings, and calendar events in one unified space')}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleSyncGoogle} disabled={loading} className="btn btn-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? t('მიმდინარეობს სინქრონიზაცია...', 'Syncing...') : 'Google Sync'}</span>
          </button>
          <button onClick={() => setShowFormModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>{t('ივენთის დამატება', 'Add Event')}</span>
          </button>
        </div>
      </header>

      {/* Calendar Header Switcher */}
      <GlassCard style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'capitalize' }}>
          {monthNames[month]} {year}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date(2026, 5, 12))} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            {t('დღეს', 'Today')}
          </button>
          <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </GlassCard>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '1px',
        background: 'var(--border-light)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
      }}>
        {/* Days of Week */}
        {daysOfWeek.map(day => (
          <div key={day} style={{
            background: 'hsl(var(--bg-surface-elevated))',
            padding: '0.75rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'hsl(var(--text-secondary))',
            borderBottom: '1px solid var(--border-light)'
          }}>
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
              style={{
                background: cell.isCurrentMonth ? 'rgba(23, 28, 48, 0.35)' : 'rgba(10, 15, 30, 0.45)',
                minHeight: '110px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                opacity: cell.isCurrentMonth ? 1 : 0.4,
                borderRight: '1px solid var(--border-light)',
                borderBottom: '1px solid var(--border-light)',
                position: 'relative'
              }}
            >
              {/* Day Number */}
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                color: isToday ? 'white' : 'hsl(var(--text-secondary))',
                background: isToday ? 'hsl(var(--primary))' : 'transparent',
                width: isToday ? '24px' : 'auto',
                height: isToday ? '24px' : 'auto',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem',
                fontSize: isToday ? '0.75rem' : '0.8rem'
              }}>
                {cell.day}
              </span>

              {/* Render Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'hidden', flex: 1 }}>
                {dateEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id} 
                    onClick={() => setSelectedEvent(event)}
                    style={{ 
                      fontSize: '0.65rem', 
                      padding: '0.2rem 0.4rem', 
                      borderRadius: '4px',
                      background: event.type === 'task' && event.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                      color: event.type === 'task' && event.completed ? 'hsl(var(--accent-emerald))' : 'white',
                      borderLeft: `3px solid ${event.color}`,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    {event.type === 'meeting' && <Video size={10} style={{ color: 'hsl(var(--accent-blue))', flexShrink: 0 }} />}
                    {event.type === 'task' && <CheckSquare size={10} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />}
                    <span>{event.title}</span>
                  </div>
                ))}
                
                {dateEvents.length > 3 && (
                  <span style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', paddingLeft: '0.25rem' }}>
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
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--bg-surface-elevated))',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            width: '100%', maxWidth: '400px',
            padding: '1.75rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ 
              fontWeight: 800, 
              fontSize: '1.2rem', 
              marginBottom: '1rem', 
              borderLeft: `4px solid ${selectedEvent.color}`, 
              paddingLeft: '0.5rem' 
            }}>
              {selectedEvent.title}
            </h3>

            {selectedEvent.description && (
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {selectedEvent.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-secondary))' }}>
                <Clock size={14} style={{ color: 'hsl(var(--primary))' }} />
                <span>{t('თარიღი: ', 'Date: ')} <strong>{selectedEvent.date}</strong> {selectedEvent.time && ` | ${selectedEvent.time}`}</span>
              </div>

              {selectedEvent.meetLink && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--text-secondary))' }}>
                  <Video size={14} style={{ color: 'hsl(var(--accent-blue))' }} />
                  <a href={selectedEvent.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--accent-blue))', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {t('Google Meet შეხვედრა', 'Google Meet Meeting')}
                    <Link size={10} />
                  </a>
                </div>
              )}

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div>
                  <span style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>{t('მონაწილეები:', 'Participants:')}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {selectedEvent.participants.map(p => (
                      <span key={p} style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.googleSynced && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'hsl(var(--accent-amber))', fontWeight: 600 }}>
                  <Clock size={12} />
                  <span>{t('სინქრონიზებულია Google Calendar-თან', 'Synced with Google Calendar')}</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedEvent(null)} 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {t('დახურვა', 'Close')}
            </button>
          </div>
        </div>
      )}

      {/* Add Event Form Modal */}
      {showFormModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'hsl(var(--bg-surface-elevated))',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            width: '100%', maxWidth: '400px',
            padding: '1.75rem',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.25rem' }}>{t('ივენთის დამატება', 'Add Event')}</h3>

            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('სათაური', 'Title')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t("ივენთის დასახელება", "Event Title")} 
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('ტიპი', 'Type')}</label>
                <select 
                  className="form-select" 
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                >
                  <option value="event">{t('ივენთი (Event)', 'Event')}</option>
                  <option value="task">{t('დავალება (Task)', 'Task')}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('თარიღი', 'Date')}</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('დრო', 'Time')}</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('აღწერა', 'Description')}</label>
                <textarea 
                  className="form-textarea" 
                  placeholder={t("დამატებითი დეტალები...", "Additional details...")} 
                  rows="2"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  {t('გაუქმება', 'Cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  {t('დამატება', 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
