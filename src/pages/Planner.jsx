import { useState } from 'react';
import { db } from '../utils/db';

export const Planner = ({ language, setActivePage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [tasks, setTasks] = useState(() => db.getTasks() || []);
  const [meetings] = useState(() => db.getMeetings() || []);
  const [selectedDate, setSelectedDate] = useState('2026-06-12');
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState('სამსახური 💼');
  const [taskPriority, setTaskPriority] = useState('🔴 მაღალი');
  const [viewMode, setViewMode] = useState('week');

  const getDatePickerDays = (centerDateStr) => {
    const days = [];
    const center = new Date(centerDateStr);
    for (let i = -3; i <= 3; i++) {
      const d = new Date(center);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const pickerDays = getDatePickerDays(selectedDate);
  const formatDateStr = (date) => date.toISOString().split('T')[0];

  const getTimelineItems = (dateStr) => {
    const dayMeetings = meetings.filter(m => m.date === dateStr);
    const dayTasks = tasks.filter(task => task.date === dateStr);
    const items = [];
    dayMeetings.forEach(m => {
      items.push({ id: m.id, time: m.time || "12:00", title: m.title, type: 'meeting', category: 'Meeting', desc: m.description, meetLink: m.meetLink, completed: false });
    });
    dayTasks.forEach((task, index) => {
      const times = ["09:00", "10:30", "15:00", "17:30"];
      const taskTime = times[index % times.length];
      items.push({ id: task.id, time: taskTime, title: task.text || task.name, type: 'task', category: task.category, priority: task.priority, completed: task.completed });
    });
    items.sort((a, b) => a.time.localeCompare(b.time));
    return items;
  };

  const rawTimelineItems = getTimelineItems(selectedDate);

  const getTimelineWithGaps = (items) => {
    if (items.length === 0) return [];
    const result = [];
    const parseToMin = (tStr) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };
    const firstEventTime = parseToMin(items[0].time);
    if (firstEventTime >= 120) {
      result.push({ id: 'gap-start', time: '08:00', type: 'gap', duration: Math.round(firstEventTime / 60) });
    }
    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);
      if (i < items.length - 1) {
        const current = items[i];
        const next = items[i + 1];
        const currentEnd = parseToMin(current.time) + 60;
        const nextStart = parseToMin(next.time);
        const gap = nextStart - currentEnd;
        if (gap >= 120) {
          const gapHour = Math.floor(currentEnd / 60);
          const gapMin = currentEnd % 60;
          const gapTimeStr = `${String(gapHour).padStart(2, '0')}:${String(gapMin).padStart(2, '0')}`;
          result.push({ id: `gap-${current.id}-${next.id}`, time: gapTimeStr, type: 'gap', duration: Math.round(gap / 60) });
        }
      }
    }
    return result;
  };

  const timelineItems = getTimelineWithGaps(rawTimelineItems);

  const handleToggleTask = (taskId) => {
    const updated = tasks.map(task => {
      if (task.id === taskId) return { ...task, completed: !task.completed };
      return task;
    });
    setTasks(updated);
    db.saveTasks(updated);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    const newTask = { id: `task-${Date.now()}`, text: taskText.trim(), name: taskText.trim(), date: selectedDate, category: taskCategory, priority: taskPriority, status: '⚠️ არ დაგიწყია', completed: false };
    const updated = [...tasks, newTask];
    setTasks(updated);
    db.saveTasks(updated);
    setTaskText('');
    setShowAddModal(false);
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const selectedDateObj = new Date(selectedDate);
  const monthLabel = `${monthNames[selectedDateObj.getMonth()]} ${selectedDateObj.getFullYear()}`;

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[1600px] mx-auto w-full">
      {/* Top Bar with View Switcher - Desktop */}
      <div className="hidden md:flex justify-between items-center mb-xl">
        <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('პლანერი', 'Planner')}</h2>
        <div className="flex items-center gap-md">
          <div className="bg-surface-container-high border border-outline-variant rounded-full p-1.5 flex">
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-6 py-2 font-label text-sm transition-all rounded-full cursor-pointer ${
                  viewMode === mode ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {mode === 'day' ? t('დღე', 'Day') : mode === 'week' ? t('კვირა', 'Week') : t('თვე', 'Month')}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-label text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary-container/10 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('ახალი ჩანაწერი', 'New Entry')}
          </button>
        </div>
      </div>

      {/* Mobile View Switcher */}
      <div className="md:hidden flex p-1.5 bg-surface-container-low rounded-full mb-stack-lg border border-outline-variant/20">
        {['day', 'week', 'month'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2.5 font-label text-[12px] rounded-full transition-all cursor-pointer ${
              viewMode === mode ? 'bg-accent-indigo text-on-primary-fixed shadow-lg font-bold' : 'text-on-surface-variant'
            }`}
          >
            {mode === 'day' ? t('დღე', 'Day') : mode === 'week' ? t('კვირა', 'Week') : t('თვე', 'Month')}
          </button>
        ))}
      </div>

      {/* Month Label */}
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl md:text-display-lg font-bold">{monthLabel}</span>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors border border-outline-variant cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
            </button>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors border border-outline-variant cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Scroller */}
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 mb-xl">
        {pickerDays.map((day) => {
          const dateStr = formatDateStr(day);
          const isActive = dateStr === selectedDate;
          const weekday = dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1];
          const dayNum = day.getDate();
          const isToday = dateStr === '2026-06-12';

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex-shrink-0 glass-card p-4 md:p-6 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer ${
                isActive ? 'border-primary-fixed-dim bg-primary-fixed-dim/10' : ''
              } ${!isActive && !isToday ? 'opacity-50' : ''}`}
              style={{ minWidth: isActive ? '100px' : '90px', minHeight: isActive ? '120px' : '100px' }}
            >
              <span className={`font-label text-[10px] md:text-xs uppercase tracking-widest ${isActive ? 'text-primary-fixed-dim font-bold' : 'text-on-surface-variant'}`}>{weekday}</span>
              <span className="font-display text-xl md:text-headline-md">{dayNum}</span>
              {isActive && <div className="w-2 h-2 bg-primary-fixed-dim rounded-full mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Timeline View */}
      <div className="relative pl-14 space-y-8 md:space-y-12">
        <div className="absolute left-6 top-0 bottom-0 w-[1px] timeline-line opacity-20" />

        {/* Current Time Indicator */}
        <div className="absolute left-0 right-0 top-[320px] h-[1px] bg-primary-fixed-dim/30 z-0 pointer-events-none hidden md:block">
          <div className="absolute -left-[5.5px] -top-1.5 w-3 h-3 bg-primary-fixed-dim rounded-full shadow-[0_0_12px_rgba(0,219,233,0.5)]" />
        </div>

        {timelineItems.length > 0 ? (
          timelineItems.map((item) => {
            if (item.type === 'gap') {
              return (
                <div key={item.id} className="relative py-2 md:py-4">
                  <span className="absolute -left-14 top-1/2 -translate-y-1/2 font-label text-xs text-on-surface-variant opacity-40">{item.time}</span>
                  <div className="absolute left-6 top-1/2 -translate-x-[3.5px] -translate-y-1/2 w-2 h-2 rounded-full border border-dashed border-primary-fixed-dim bg-background" />
                  <div className="border-2 border-dashed border-outline-variant/30 p-4 md:p-8 rounded-xl flex flex-col items-center text-center bg-surface-container-low/50 hover:border-primary-fixed-dim/50 transition-all">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-3xl md:text-4xl mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    <h4 className="font-display text-lg font-bold text-on-surface">{t('ინტელექტუალური ფოკუს-გეპი', 'Intelligent Focus Gap')}</h4>
                    <p className="font-body text-sm text-on-surface-variant mt-2 px-4 md:px-6">
                      {t(`თქვენ გაქვთ ${item.duration} საათი თავისუფალი დრო. იდეალურია ღრმა მუშაობისთვის.`, `You have ${item.duration} hours of free time. Perfect for deep work or a recharge.`)}
                    </p>
                    <button onClick={() => setShowAddModal(true)} className="mt-3 md:mt-6 px-4 md:px-6 py-2 md:py-2.5 bg-primary-fixed-dim/10 hover:bg-primary-fixed-dim/20 text-primary-fixed-dim rounded-full font-label text-[11px] transition-all border border-primary-fixed-dim/30 font-bold uppercase tracking-wider cursor-pointer">
                      {t('სწრაფი დამატება', 'Quick Add Task')}
                    </button>
                  </div>
                </div>
              );
            }

            const isMeeting = item.type === 'meeting';
            const isHighPrio = item.priority && item.priority.includes('მაღალი');
            const [hStr, mStr] = item.time.split(':');
            const hNum = parseInt(hStr);
            const dH = hNum > 12 ? hNum - 12 : (hNum === 0 ? 12 : hNum);

            return (
              <div key={item.id} className="relative">
                <span className="absolute -left-14 top-2 md:top-4 font-label text-xs text-on-surface-variant">{dH}:{mStr}</span>
                <div className={`absolute left-6 top-3 md:top-5 -translate-x-[3.5px] w-2 h-2 rounded-full ${isMeeting ? 'bg-secondary' : isHighPrio ? 'bg-primary-fixed-dim' : 'border border-primary-fixed-dim bg-background'}`} />
                <div
                  onClick={() => isMeeting && item.meetLink ? window.open(item.meetLink, '_blank') : null}
                  className={`glass-card p-4 md:p-md rounded-xl group hover:border-primary-fixed-dim transition-all cursor-pointer relative overflow-hidden ${
                    isMeeting ? 'border-l-4 border-l-secondary' : isHighPrio ? 'border-l-8 border-l-primary-fixed-dim bg-primary-fixed-dim/5' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-label text-[10px] md:text-xs uppercase tracking-widest ${isMeeting ? 'text-secondary' : 'text-primary-fixed-dim'}`}>
                          {isMeeting ? t('შეხვედრა', 'Meeting') : t('დავალება', 'Task')}
                        </span>
                        {isMeeting && (
                          <span className="flex items-center gap-1 font-label text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">videocam</span> 45 min
                          </span>
                        )}
                        {isHighPrio && (
                          <span className="bg-error/20 text-error px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">High Priority</span>
                        )}
                      </div>
                      <h3 className={`font-display text-base md:text-headline-md font-semibold text-on-surface ${item.completed ? 'line-through text-on-surface-variant' : ''}`}>{item.title}</h3>
                      {item.desc && <p className="font-body text-sm text-on-surface-variant mt-2 max-w-2xl">{item.desc}</p>}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {isMeeting ? (
                        item.meetLink ? (
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed-dim transition-colors">open_in_new</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
                        )
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleTask(item.id); }}
                          className="text-on-surface-variant hover:text-primary-fixed-dim cursor-pointer transition-colors bg-transparent border-none"
                        >
                          <span className="material-symbols-outlined">{item.completed ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card rounded-xl p-8 md:p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">event_busy</span>
            <span className="text-on-surface-variant font-body-md">{t('დღეს დაგეგმილი ღონისძიებები არ არის.', 'No events scheduled for this day.')}</span>
            <button onClick={() => setShowAddModal(true)} className="mt-6 px-6 py-3 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-full hover:bg-primary-container cursor-pointer active:scale-95 transition-all border-none">
              {t('+ ახალი დაგეგმვა', 'Add Event / Task')}
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setShowAddModal(true); }} className="fixed bottom-28 md:bottom-8 right-margin-mobile md:right-margin-desktop w-14 h-14 md:w-16 md:h-16 bg-primary-fixed-dim text-on-primary-fixed rounded-full shadow-[0_8px_32px_rgba(0,219,233,0.4)] flex items-center justify-center z-50 transform hover:scale-105 active:scale-90 transition-all cursor-pointer border-none">
        <span className="material-symbols-outlined text-2xl md:text-3xl font-bold">add</span>
      </button>

      {/* AI Assistant Orb */}
      <div className="fixed bottom-28 right-24 md:bottom-8 md:right-36 z-50">
        <button onClick={() => setActivePage('insights')} className="w-12 h-12 md:w-16 md:h-16 bg-primary-container text-on-primary-container rounded-full shadow-2xl shadow-primary-container/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden border-4 border-surface cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="material-symbols-outlined text-2xl md:text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </button>
      </div>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full relative border border-outline-variant/30 shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white cursor-pointer bg-transparent border-none">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold text-white mb-6">{t('ახალი დაგეგმვა', 'Add Event / Task')}</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input type="text" value={taskText} onChange={e => setTaskText(e.target.value)} placeholder={t('დავალების სახელი...', 'Task title...')} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
              <div className="grid grid-cols-2 gap-4">
                <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option>სამსახური 💼</option><option>ჯანმრთელობა 💪🏻</option><option>ფული ₿</option><option>ოჯახი 👨‍👩‍👧‍👦</option><option>პირადი განვითარება 📚</option>
                </select>
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option>🔴 მაღალი</option><option>🟡 საშუალო</option><option>🔵 დაბალი</option><option>⚪️ სურვილისამებრ</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed py-2.5 rounded-full font-bold text-sm cursor-pointer hover:bg-primary-container active:scale-[0.98] transition-all border-none">{t('დაგეგმვა', 'Add Task')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
