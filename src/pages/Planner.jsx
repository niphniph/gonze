import { useState } from 'react';
import { db } from '../utils/db';

export const Planner = ({ language, setActivePage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);

  // Load Database State
  const [tasks, setTasks] = useState(() => db.getTasks() || []);
  const [meetings] = useState(() => db.getMeetings() || []);
  // Calendar Selected Date
  const [selectedDate, setSelectedDate] = useState('2026-06-12');
  
  // Modals & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [taskText, setTaskText] = useState('');
  const [taskCategory, setTaskCategory] = useState('სამსახური 💼');
  const [taskPriority, setTaskPriority] = useState('🔴 მაღალი');

  // Date picker generation (3 days before, 3 days after)
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

  // Dynamic Timeline Item builder
  const getTimelineItems = (dateStr) => {
    const dayMeetings = meetings.filter(m => m.date === dateStr);
    const dayTasks = tasks.filter(task => task.date === dateStr);

    const items = [];

    // Add meetings
    dayMeetings.forEach(m => {
      items.push({
        id: m.id,
        time: m.time || "12:00",
        title: m.title,
        type: 'meeting',
        category: 'Meeting',
        desc: m.description,
        meetLink: m.meetLink,
        completed: false
      });
    });

    // Add tasks (assigning distributed times for visual representation in timeline)
    dayTasks.forEach((task, index) => {
      const times = ["09:00", "10:30", "15:00", "17:30"];
      const taskTime = times[index % times.length];
      items.push({
        id: task.id,
        time: taskTime,
        title: task.text || task.name,
        type: 'task',
        category: task.category,
        priority: task.priority,
        completed: task.completed
      });
    });

    // Sort by time ascending
    items.sort((a, b) => a.time.localeCompare(b.time));
    return items;
  };

  const rawTimelineItems = getTimelineItems(selectedDate);

  // Compute Focus Gaps (>= 2 hours free time)
  const getTimelineWithGaps = (items) => {
    if (items.length === 0) return [];
    
    const result = [];
    const parseToMin = (tStr) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Insert start-of-day gap if first event is late
    const firstEventTime = parseToMin(items[0].time);
    if (firstEventTime >= 120) { // 2+ hours since 8:00 AM (480 mins)
      result.push({
        id: 'gap-start',
        time: '08:00',
        type: 'gap',
        duration: Math.round(firstEventTime / 60)
      });
    }

    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);

      if (i < items.length - 1) {
        const current = items[i];
        const next = items[i+1];
        
        const currentEnd = parseToMin(current.time) + 60; // Assume 1 hr event duration
        const nextStart = parseToMin(next.time);
        const gap = nextStart - currentEnd;

        if (gap >= 120) { // 2+ hours
          const gapHour = Math.floor(currentEnd / 60);
          const gapMin = currentEnd % 60;
          const gapTimeStr = `${String(gapHour).padStart(2, '0')}:${String(gapMin).padStart(2, '0')}`;
          result.push({
            id: `gap-${current.id}-${next.id}`,
            time: gapTimeStr,
            type: 'gap',
            duration: Math.round(gap / 60)
          });
        }
      }
    }

    return result;
  };

  const timelineItems = getTimelineWithGaps(rawTimelineItems);

  const handleToggleTask = (taskId) => {
    const updated = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updated);
    db.saveTasks(updated);
  };

  const handleQuickAddInsideGap = () => {
    setShowAddModal(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      text: taskText.trim(),
      name: taskText.trim(),
      date: selectedDate,
      category: taskCategory,
      priority: taskPriority,
      status: '⚠️ არ დაგიწყია',
      completed: false
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    db.saveTasks(updated);

    setTaskText('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen text-text-primary px-margin-mobile md:px-margin-desktop py-stack-lg max-w-4xl mx-auto space-y-stack-lg pb-32">
      
      {/* Page Header */}
      <section className="flex justify-between items-center">
        <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">{t('პლანერი', 'Planner')}</h2>
        <div className="flex items-center gap-2">
          <button className="material-symbols-outlined text-text-secondary hover:text-white cursor-pointer transition-colors">search</button>
        </div>
      </section>

      {/* Day / Week / Month Tab Switcher */}
      <div className="flex p-1 bg-surface-container-high rounded-full border border-outline-variant/30">
        <button 
          onClick={() => setActivePage('planner')}
          className="flex-1 py-2 font-label-sm text-label-sm rounded-full transition-all bg-primary-fixed-dim/20 text-primary-fixed-dim font-bold shadow-sm cursor-pointer"
        >
          {t('დღე', 'Day')}
        </button>
        <button 
          onClick={() => setActivePage('weekly')}
          className="flex-1 py-2 font-label-sm text-label-sm rounded-full transition-all text-text-secondary hover:text-text-primary cursor-pointer"
        >
          {t('კვირა', 'Week')}
        </button>
        <button 
          onClick={() => setActivePage('calendar')}
          className="flex-1 py-2 font-label-sm text-label-sm rounded-full transition-all text-text-secondary hover:text-text-primary cursor-pointer"
        >
          {t('თვე', 'Month')}
        </button>
      </div>

      {/* Horizontal Scrollable Date Picker */}
      <div className="overflow-x-auto no-scrollbar -mx-margin-mobile px-margin-mobile flex gap-4 items-center py-3">
        {pickerDays.map((day) => {
          const dateStr = formatDateStr(day);
          const isActive = dateStr === selectedDate;
          const weekday = day.toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'short' });
          const dayNum = day.getDate();
          
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'w-16 h-24 bg-primary-fixed-dim/10 border border-primary-fixed-dim active-date-glow transform scale-105 text-text-primary font-bold' 
                  : 'w-14 h-20 glass-card text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className={`text-[10px] uppercase ${isActive ? 'text-primary-fixed-dim font-bold' : 'text-text-tertiary'}`}>{weekday}</span>
              <span className="text-xl mt-1">{dayNum}</span>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim mt-1"></div>}
            </button>
          );
        })}
      </div>

      {/* Vertical Schedule Timeline */}
      <div className="relative pl-14 space-y-8">
        
        {/* Vertical Timeline Line */}
        <div className="absolute left-6 top-2 bottom-2 w-[1px] bg-gradient-to-b from-primary-fixed-dim via-primary-fixed-dim/40 to-transparent opacity-30"></div>

        {timelineItems.length > 0 ? (
          timelineItems.map((item) => {
            const isMeeting = item.type === 'meeting';
            const isTask = item.type === 'task';
            const isGap = item.type === 'gap';

            if (isGap) {
              return (
                <div key={item.id} className="relative py-2">
                  <span className="absolute -left-14 top-1/2 -translate-y-1/2 font-label-sm text-xs text-text-tertiary">{item.time}</span>
                  <div className="absolute left-6 top-1/2 -translate-x-[3.5px] -translate-y-1/2 w-2 h-2 rounded-full border border-dashed border-primary-fixed-dim bg-background"></div>
                  
                  <div className="rounded-2xl border border-dashed border-outline-variant/40 p-5 flex flex-col items-center text-center bg-surface-container-low/50 hover:bg-surface-container-high/50 transition-all">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-2xl mb-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    <h4 className="font-title-md text-sm font-bold text-text-primary">{t('ინტელექტუალური ფოკუს-გეპი', 'Intelligent Focus Gap')}</h4>
                    <p className="font-body-md text-xs text-text-secondary mt-1 px-4">
                      {t(`თქვენ გაქვთ ${item.duration} საათი თავისუფალი დრო. გამოიყენეთ ფოკუსირებისთვის.`, `You have ${item.duration} hours of free time. Perfect for deep work.`)}
                    </p>
                    <button 
                      onClick={() => handleQuickAddInsideGap(item.time)}
                      className="mt-3 px-4 py-1.5 bg-white/5 hover:bg-primary-fixed-dim/20 hover:text-primary-fixed-dim rounded-full font-label-sm text-xs transition-all border border-outline-variant/30 cursor-pointer active:scale-95"
                    >
                      {t('+ დავალების დამატება', 'Quick Add Task')}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="relative">
                <span className="absolute -left-14 top-3.5 font-label-sm text-xs text-text-secondary">{item.time}</span>
                <div className={`absolute left-6 top-5 -translate-x-[3.5px] w-2 h-2 rounded-full ${isMeeting ? 'bg-secondary-fixed-dim' : 'border border-primary-fixed-dim bg-background'}`}></div>
                
                <div 
                  className={`glass-card p-4 rounded-2xl border-l-4 transition-all hover:scale-[1.01] hover:border-r-primary-fixed-dim/20 ${
                    isMeeting ? 'border-l-secondary-fixed-dim bg-secondary-fixed-dim/5 hover:bg-secondary-fixed-dim/10' : t(item.priority.includes('მაღალი') ? 'border-l-red-500 bg-red-500/5' : 'border-l-primary-fixed-dim bg-primary-fixed-dim/5 hover:bg-primary-fixed-dim/10')
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isMeeting ? 'bg-secondary-fixed-dim/10 text-secondary-fixed-dim' : 'bg-white/5 text-text-secondary'
                    }`}>
                      {isMeeting ? t('შეხვედრა', 'Meeting') : t(item.priority, item.priority)}
                    </span>
                    
                    {isTask && (
                      <button 
                        onClick={() => handleToggleTask(item.id)}
                        className="text-text-secondary hover:text-primary-fixed-dim cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {item.completed ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </button>
                    )}
                  </div>
                  
                  <h3 className={`font-title-md text-sm font-bold ${item.completed ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{item.title}</h3>
                  
                  {isMeeting && (
                    <div className="flex items-center gap-3 text-text-secondary mt-2 text-xs">
                      <span className="flex items-center gap-1 font-label-sm"><span className="material-symbols-outlined text-xs">schedule</span> 60 min</span>
                      {item.meetLink && (
                        <a href={item.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-label-sm text-secondary-fixed-dim hover:underline">
                          <span className="material-symbols-outlined text-xs">video_call</span> Google Meet
                        </a>
                      )}
                    </div>
                  )}

                  {isTask && (
                    <div className="flex items-center gap-3 text-text-secondary mt-2 text-xs">
                      <span className="flex items-center gap-1 font-label-sm">
                        <span className="material-symbols-outlined text-xs">tag</span> {item.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="hairline-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-container-low/20">
            <span className="material-symbols-outlined text-3xl text-text-tertiary mb-2">event_busy</span>
            <span className="text-text-secondary text-sm font-semibold">{t('დღეს განრიგი თავისუფალია.', 'No events scheduled for this day.')}</span>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-full text-xs hover:bg-primary-container cursor-pointer active:scale-95 transition-all"
            >
              {t('+ ახალი დაგეგმვა', 'Add Event / Task')}
            </button>
          </div>
        )}

      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => { setShowAddModal(true); }}
        className="fixed bottom-24 right-margin-mobile md:bottom-8 md:right-8 w-14 h-14 bg-primary-fixed-dim text-on-primary-fixed rounded-full shadow-[0_8px_24px_rgba(0,219,233,0.4)] flex items-center justify-center z-50 transform hover:scale-105 active:scale-95 cursor-pointer transition-all"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </button>

      {/* Quick Add Event/Task Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full relative border border-border-hairline shadow-2xl">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Modal Title */}
            <h3 className="text-lg font-bold text-white mb-6">{t('ახალი დაგეგმვა', 'Add Event / Task')}</h3>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">{t('დავალების სახელი', 'Task Title')}</label>
                <input 
                  type="text" 
                  value={taskText} 
                  onChange={e => setTaskText(e.target.value)} 
                  placeholder={t('მაგ. მოხსენების მომზადება', 'e.g. Write monthly report')}
                  className="w-full bg-white/5 border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{t('კატეგორია', 'Category')}</label>
                  <select 
                    value={taskCategory} 
                    onChange={e => setTaskCategory(e.target.value)}
                    className="w-full bg-surface-container-high border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option>სამსახური 💼</option>
                    <option>ჯანმრთელობა 💪🏻</option>
                    <option>ფული ₿</option>
                    <option>ოჯახი 👨‍👩‍👧‍👦</option>
                    <option>პირადი განვითარება 📚</option>
                    <option>საქმეები 🧹</option>
                    <option>იდეები 💡</option>
                    <option>დასვენება 🎮</option>
                    <option>სულიერება 🧘🏻</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{t('პრიორიტეტი', 'Priority')}</label>
                  <select 
                    value={taskPriority} 
                    onChange={e => setTaskPriority(e.target.value)}
                    className="w-full bg-surface-container-high border border-border-hairline rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option>🔴 მაღალი</option>
                    <option>🟡 საშუალო</option>
                    <option>🔵 დაბალი</option>
                    <option>⚪️ სურვილისამებრ</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary-fixed-dim text-on-primary-fixed py-2.5 rounded-full font-bold text-sm cursor-pointer hover:bg-primary-container active:scale-[0.98] transition-all">
                {t('დაგეგმვა', 'Add Task')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
