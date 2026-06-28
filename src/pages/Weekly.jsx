import { useState } from 'react';
import { Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';

const generateWeeklyTaskId = () => `w-task-${Date.now()}`;

export const Weekly = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [weeklyData, setWeeklyData] = useState(() => db.getWeekly() || {});
  const [selectedWeekStart, setSelectedWeekStart] = useState('2026-06-07'); // Default week
  const [newTasks, setNewTasks] = useState({
    day0: '', day1: '', day2: '', day3: '', day4: '', day5: '', day6: ''
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysOfWeekKa = {
    'Sunday': 'კვირა',
    'Monday': 'ორშაბათი',
    'Tuesday': 'სამშაბათი',
    'Wednesday': 'ოთხშაბათი',
    'Thursday': 'ხუთშაბათი',
    'Friday': 'პარასკევი',
    'Saturday': 'შაბათი'
  };
  const daysOfWeekEn = {
    'Sunday': 'Sunday',
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday',
    'Saturday': 'Saturday'
  };

  const updateWeeklyState = (newData) => {
    setWeeklyData(newData);
    db.saveWeekly(newData);
  };

  // Get days list for the selected week
  const getDaysList = () => {
    const dates = [];
    const baseDate = new Date(selectedWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getDay()];
      dates.push({ 
        dateStr, 
        dayName, 
        label: language === 'ka' ? daysOfWeekKa[dayName] : daysOfWeekEn[dayName], 
        index: i 
      });
    }
    return dates;
  };

  const weekDays = getDaysList();

  // Get tasks for a specific day
  const getTasksForDay = (dayName) => {
    const week = weeklyData[selectedWeekStart] || {};
    return week[dayName] || [];
  };

  // Add task for a specific day
  const handleAddTask = (dayName, dayIndex) => {
    const taskName = newTasks[`day${dayIndex}`];
    if (!taskName.trim()) return;

    const currentWeek = { ...(weeklyData[selectedWeekStart] || {}) };
    const dayTasks = [...(currentWeek[dayName] || [])];

    const newTask = {
      id: generateWeeklyTaskId(),
      name: taskName,
      completed: false
    };

    dayTasks.push(newTask);
    currentWeek[dayName] = dayTasks;

    const updated = {
      ...weeklyData,
      [selectedWeekStart]: currentWeek
    };

    updateWeeklyState(updated);
    setNewTasks({ ...newTasks, [`day${dayIndex}`]: '' });
  };

  // Toggle task checkbox
  const handleToggleTask = (dayName, taskId) => {
    const currentWeek = { ...(weeklyData[selectedWeekStart] || {}) };
    const dayTasks = (currentWeek[dayName] || []).map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    currentWeek[dayName] = dayTasks;
    const updated = {
      ...weeklyData,
      [selectedWeekStart]: currentWeek
    };
    updateWeeklyState(updated);
  };

  // Delete task
  const handleDeleteTask = (dayName, taskId) => {
    if (window.confirm(t("დარწმუნებული ხართ, რომ გსურთ გეგმის წაშლა?", "Are you sure you want to delete this plan?"))) {
      const currentWeek = { ...(weeklyData[selectedWeekStart] || {}) };
      const dayTasks = (currentWeek[dayName] || []).filter(t => t.id !== taskId);

      currentWeek[dayName] = dayTasks;
      const updated = {
        ...weeklyData,
        [selectedWeekStart]: currentWeek
      };
      updateWeeklyState(updated);
    }
  };

  // Calculate stats for current week
  let totalTasks = 0;
  let completedTasks = 0;
  
  weekDays.forEach(day => {
    const dayTasks = getTasksForDay(day.dayName);
    dayTasks.forEach(t => {
      totalTasks++;
      if (t.completed) completedTasks++;
    });
  });

  const weeklyPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Chart Data: Completion rate per day
  const chartData = weekDays.map(day => {
    const dayTasks = getTasksForDay(day.dayName);
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      name: day.label,
      rate: pct,
      tasksCount: total
    };
  });

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('კვირეული', 'Weekly Tracker')}</h2>
          <p className="font-body-md text-on-surface-variant">{t('დაგეგმეთ თქვენი მიზნები და დავალებები კვირის ჭრილში', 'Plan your goals and tasks in a weekly view')}</p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-surface-container-high border border-outline-variant/30 px-4 py-2.5 rounded-xl">
          <Calendar size={16} className="text-primary-fixed-dim" />
          <span className="font-body-md text-xs text-on-surface-variant font-medium">{t('კვირის დასაწყისი:', 'Week Start:')}</span>
          <input 
            type="date" 
            className="bg-transparent border-none text-on-surface text-xs focus:outline-none cursor-pointer"
            value={selectedWeekStart} 
            onChange={e => setSelectedWeekStart(e.target.value)} 
          />
        </div>
      </header>

      {/* Week Progress Card */}
      <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full text-center md:text-left">
          <h3 className="font-headline-md text-lg font-bold text-on-surface mb-1">{t('ამ კვირის საერთო პროგრესი', "This Week's Overall Progress")}</h3>
          <p className="font-body-md text-xs text-on-surface-variant">{t('კვირის ყველა ამოცანის შესრულების მაჩვენებელი', 'Completion rate for all weekly tasks')}</p>
        </div>
        <div className="w-full md:max-w-md flex-1">
          <ProgressBar progress={weeklyPct} />
        </div>
      </div>

      {/* Daily Task Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {weekDays.map(day => {
          const tasks = getTasksForDay(day.dayName);
          const completedCount = tasks.filter(t => t.completed).length;
          const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

          return (
            <div key={day.dayName} className="glass-card rounded-xl p-5 flex flex-col min-h-[350px]">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-headline-md text-base font-bold text-on-surface">{day.label}</h4>
                  <span className="font-label text-[10px] text-on-surface-variant/70">{day.dateStr}</span>
                </div>
                {tasks.length > 0 && (
                  <span className={`font-label text-xs font-bold ${pct === 100 ? 'text-green-400' : 'text-primary-fixed-dim'}`}>
                    {pct}%
                  </span>
                )}
              </div>

              {/* Day's Tasks */}
              <div className="flex-1 flex flex-col gap-2 my-2 overflow-y-auto max-h-[200px] custom-scrollbar">
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/10 hover:border-primary-fixed-dim/20 transition-all ${task.completed ? 'opacity-60' : ''}`}
                    >
                      <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-outline bg-transparent text-primary-fixed-dim focus:ring-primary-fixed-dim cursor-pointer"
                          checked={task.completed} 
                          onChange={() => handleToggleTask(day.dayName, task.id)} 
                        />
                        <span className={`font-body-md text-xs truncate ${
                          task.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                        }`}>
                          {task.name}
                        </span>
                      </label>
                      <button 
                        onClick={() => handleDeleteTask(day.dayName, task.id)}
                        className="text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none p-1 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-outline-variant/20 rounded-xl p-4 text-on-surface-variant/50 text-xs">
                    <ClipboardList size={20} className="mb-1 opacity-55 text-primary-fixed-dim" />
                    <span>{t('დავალებები ცარიელია', 'No tasks planned')}</span>
                  </div>
                )}
              </div>

              {/* Add Task Input inside Card */}
              <div className="mt-auto flex gap-2 border-t border-outline-variant/20 pt-3">
                <input 
                  type="text" 
                  className="flex-1 bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary-fixed-dim transition-colors"
                  placeholder={t("ახალი გეგმა...", "New plan...")} 
                  value={newTasks[`day${day.index}`]} 
                  onChange={e => setNewTasks({ ...newTasks, [`day${day.index}`]: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(day.dayName, day.index); }}
                />
                <button 
                  onClick={() => handleAddTask(day.dayName, day.index)}
                  className="bg-primary-fixed-dim text-on-primary-fixed p-1.5 rounded-lg hover:bg-primary-container transition-all active:scale-95 cursor-pointer flex items-center justify-center border-none"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Completion Chart */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h3 className="font-headline-md text-base font-bold text-on-surface mb-6">{t('კვირის პროგრესი დღეების მიხედვით (%)', 'Weekly Progress by Day (%)')}</h3>
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--color-outline)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--color-outline)" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface-container-high)', 
                  borderColor: 'var(--color-outline-variant)', 
                  borderRadius: '8px',
                  color: 'var(--color-on-surface)'
                }} 
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="rate" fill="var(--color-primary-fixed-dim)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.rate === 100 ? '#4ade80' : 'var(--color-primary-fixed-dim)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
