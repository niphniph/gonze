import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';

export const Weekly = () => {
  const [weeklyData, setWeeklyData] = useState({});
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

  useEffect(() => {
    setWeeklyData(db.getWeekly());
  }, []);

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
      dates.push({ dateStr, dayName, label: daysOfWeekKa[dayName] || dayName, index: i });
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
      id: `w-task-${Date.now()}`,
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
    const currentWeek = { ...(weeklyData[selectedWeekStart] || {}) };
    const dayTasks = (currentWeek[dayName] || []).filter(t => t.id !== taskId);

    currentWeek[dayName] = dayTasks;
    const updated = {
      ...weeklyData,
      [selectedWeekStart]: currentWeek
    };
    updateWeeklyState(updated);
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
    <div className="weekly-page">
      <header className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>კვირეული</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>დაგეგმეთ თქვენი მიზნები და დავალებები კვირის ჭრილში</p>
        </div>
        
        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', padding: '0.5rem 1rem', borderRadius: '14px' }}>
          <Calendar size={16} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>კვირის დასაწყისი:</span>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '150px', padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            value={selectedWeekStart} 
            onChange={e => setSelectedWeekStart(e.target.value)} 
          />
        </div>
      </header>

      {/* Week Progress Card */}
      <section style={{ marginBottom: '2.5rem' }}>
        <GlassCard style={{ display: 'flex', justify: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>ამ კვირის საერთო პროგრესი</h3>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>კვირის ყველა ამოცანის შესრულების მაჩვენებელი</span>
          </div>
          <div style={{ minWidth: '250px', flex: 1 }}>
            <ProgressBar progress={weeklyPct} />
          </div>
        </GlassCard>
      </section>

      {/* Daily Task Columns Grid */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        {weekDays.map(day => {
          const tasks = getTasksForDay(day.dayName);
          const completedCount = tasks.filter(t => t.completed).length;
          const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

          return (
            <GlassCard key={day.dayName} style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{day.label}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{day.dateStr}</span>
                </div>
                {tasks.length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct === 100 ? 'hsl(var(--accent-emerald))' : 'hsl(var(--primary))' }}>
                    {pct}%
                  </span>
                )}
              </div>

              {/* Day's Tasks */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <div 
                      key={task.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <label className="checkbox-container" style={{ flex: 1, minWidth: 0 }}>
                        <input 
                          type="checkbox" 
                          className="checkbox-input"
                          checked={task.completed} 
                          onChange={() => handleToggleTask(day.dayName, task.id)} 
                        />
                        <span className="checkbox-custom" />
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 500,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.name}
                        </span>
                      </label>
                      <button 
                        onClick={() => handleDeleteTask(day.dayName, task.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-rose))', padding: '0.2rem' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px dashed var(--border-light)', borderRadius: '10px', padding: '1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                    <ClipboardList size={24} style={{ marginBottom: '0.35rem', opacity: 0.5 }} />
                    დავალებები ცარიელია
                  </div>
                )}
              </div>

              {/* Add Task Input inside Card */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem', flex: 1 }}
                  placeholder="ახალი გეგმა..." 
                  value={newTasks[`day${day.index}`]} 
                  onChange={e => setNewTasks({ ...newTasks, [`day${day.index}`]: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTask(day.dayName, day.index); }}
                />
                <button 
                  onClick={() => handleAddTask(day.dayName, day.index)}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem', borderRadius: '8px' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </section>

      {/* Weekly Completion Chart */}
      <section style={{ marginBottom: '1.5rem' }}>
        <GlassCard>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>კვირის პროგრესი დღეების მიხედვით (%)</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--bg-surface-elevated))', 
                    borderColor: 'var(--border-light)', 
                    borderRadius: '8px',
                    color: 'hsl(var(--text-primary))'
                  }} 
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="rate" fill="hsl(var(--accent-blue))" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate === 100 ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-blue))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};
