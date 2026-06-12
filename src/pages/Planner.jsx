import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { 
  CheckSquare, 
  Award, 
  Video, 
  Calendar, 
  Clock, 
  ArrowRight,
  Zap
} from 'lucide-react';

export const Planner = ({ language, setActivePage }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitHistory, setHabitHistory] = useState({});
  const [meetings, setMeetings] = useState([]);
  const [todayStr, setTodayStr] = useState('2026-06-12'); // Mock local date

  useEffect(() => {
    setTasks(db.getTasks() || []);
    const habitData = db.getHabits();
    setHabits(habitData.list || []);
    setHabitHistory(habitData.history || {});
    setMeetings(db.getMeetings() || []);
  }, []);

  const handleToggleTask = (taskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    setTasks(updated);
    db.saveTasks(updated);
  };

  const handleToggleHabit = (habitId) => {
    const updatedHistory = { ...habitHistory };
    if (!updatedHistory[habitId]) {
      updatedHistory[habitId] = {};
    }
    updatedHistory[habitId][todayStr] = !updatedHistory[habitId][todayStr];
    setHabitHistory(updatedHistory);
    db.saveHabits(habits, updatedHistory);
  };

  // Filters for today (2026-06-12)
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const todayMeetings = meetings.filter(m => m.date === todayStr);

  const completedTodayTasks = todayTasks.filter(t => t.completed);
  const taskProgress = todayTasks.length > 0 ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;

  // Habits completed today
  const completedTodayHabits = habits.filter(h => habitHistory[h.id]?.[todayStr]);
  const habitProgress = habits.length > 0 ? Math.round((completedTodayHabits.length / habits.length) * 100) : 0;

  // Dynamic habit categories translation
  const translateHabitCategory = (cat) => {
    if (language === 'ka') return cat;
    const clean = cat.replace(/[💪📖🗓️💰🎯\s]/g, '');
    if (clean === 'ჯანმრთელობა') return 'Health 💪';
    if (clean === 'განვითარება') return 'Development 📖';
    if (clean === 'პირადი') return 'Personal 🗓️';
    if (clean === 'ფინანსები') return 'Finance 💰';
    if (clean === 'სამსახური') return 'Work 🎯';
    return cat;
  };

  const translateTaskCategory = (cat) => {
    if (!cat) return '';
    if (language === 'ka') return cat;
    if (cat.includes('ჯანმრთელობა')) return 'Health 💪';
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

  return (
    <div className="planner-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('დღიური პლანერი', 'Daily Planner')}</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('სრული კონტროლი თქვენს დღევანდელ გეგმებზე, დავალებებსა და ჩვევებზე', 'Full control over your daily plans, tasks, and habits')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.9rem', fontWeight: 600 }}>
          <Clock size={16} style={{ color: 'hsl(var(--primary))' }} />
          <span>{t('დღეს: 12 ივნისი, 2026', 'Today: June 12, 2026')}</span>
        </div>
      </header>

      {/* Stats Summary Panel */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>{t('დავალებების პროგრესი', 'Task Progress')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{taskProgress}%</h3>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              {completedTodayTasks.length}/{todayTasks.length} {t('შესრულდა', 'completed')}
            </span>
          </div>
          <ProgressBar progress={taskProgress} type="complete" />
        </GlassCard>

        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>{t('ჩვევების შესრულება', 'Habits Progress')}</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{habitProgress}%</h3>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              {completedTodayHabits.length}/{habits.length} {t('შესრულდა', 'completed')}
            </span>
          </div>
          <ProgressBar progress={habitProgress} />
        </GlassCard>

        <GlassCard style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>{t('დღევანდელი შეხვედრები', "Today's Meetings")}</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>{todayMeetings.length} {t('ივენთი', 'events')}</h3>
          </div>
          <button 
            onClick={() => setActivePage('meetings')}
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
          >
            {t('გადასვლა', 'Go')}
            <ArrowRight size={12} />
          </button>
        </GlassCard>
      </section>

      {/* Main Grid: Todo & Habits on Left, Schedule on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>
        {/* Left Side: Tasks & Habits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Today's Tasks */}
          <GlassCard style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={18} style={{ color: 'hsl(var(--primary))' }} />
                {t('დღევანდელი დავალებები', "Today's Tasks")} ({todayTasks.length})
              </h3>
              <button 
                onClick={() => setActivePage('tasks')} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--primary-hover))', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {t('სრული სია', 'Full List')} <ArrowRight size={12} />
              </button>
            </div>

            {todayTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todayTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: '1.5px solid ' + (task.completed ? 'hsl(var(--accent-emerald))' : 'hsl(var(--text-muted))'),
                      background: task.completed ? 'hsl(var(--accent-emerald))' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      marginRight: '0.75rem',
                      flexShrink: 0
                    }}>
                      {task.completed && "✓"}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'hsl(var(--text-muted))' : 'white',
                      fontWeight: 500
                    }}>
                      {task.text || task.name}
                    </div>
                    <span style={{ fontSize: '0.65rem', marginLeft: 'auto', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', color: 'hsl(var(--text-secondary))' }}>
                      {translateTaskCategory(task.category)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                {t('დღეს დავალებები არ გაქვთ.', 'No tasks for today.')}
              </div>
            )}
          </GlassCard>

          {/* Today's Habits */}
          <GlassCard style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'hsl(var(--accent-emerald))' }} />
                {t('ჩვევების შემოწმება', 'Habit Tracker')} ({habits.length})
              </h3>
              <button 
                onClick={() => setActivePage('habits')} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-emerald))', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {t('მართვა', 'Manage')} <ArrowRight size={12} />
              </button>
            </div>

            {habits.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {habits.map(habit => {
                  const isChecked = habitHistory[habit.id]?.[todayStr] || false;
                  return (
                    <div 
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      style={{
                        padding: '0.75rem',
                        background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: isChecked ? '1px solid hsl(var(--accent-emerald) / 0.4)' : '1px solid var(--border-light)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        alignItems: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>🏆</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{habit.name}</span>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '4px',
                        border: '1.5px solid ' + (isChecked ? 'hsl(var(--accent-emerald))' : 'hsl(var(--text-muted))'),
                        background: isChecked ? 'hsl(var(--accent-emerald))' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 'bold'
                      }}>
                        {isChecked && "✓"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                {t('აქტიური ჩვევები არ გაქვთ.', 'No active habits.')}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Side: Schedule Timeline */}
        <GlassCard style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'hsl(var(--accent-blue))' }} />
              {t('დღევანდელი განრიგი', "Today's Schedule")}
            </h3>
            <button 
              onClick={() => setActivePage('calendar')} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-blue))', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              {t('კალენდარი', 'Calendar')} <ArrowRight size={12} />
            </button>
          </div>

          {todayMeetings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-light)', paddingLeft: '1rem', marginLeft: '0.5rem', flex: 1 }}>
              {todayMeetings.map((meeting, index) => (
                <div 
                  key={meeting.id} 
                  style={{ 
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem'
                  }}
                >
                  {/* Timeline Dot Indicator */}
                  <div style={{ 
                    position: 'absolute', 
                    left: '-1.45rem', 
                    top: '1.2rem', 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: 'hsl(var(--accent-blue))',
                    border: '2px solid hsl(var(--bg-surface-elevated))' 
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{meeting.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-blue))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2' }}>
                      <Clock size={12} />
                      {meeting.time}
                    </span>
                  </div>
                  
                  {meeting.description && (
                    <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{meeting.description}</p>
                  )}

                  {meeting.meetLink && (
                    <a 
                      href={meeting.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        fontSize: '0.7rem', 
                        color: 'hsl(var(--accent-blue))', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem', 
                        fontWeight: 600,
                        textDecoration: 'underline' 
                      }}
                    >
                      <Video size={10} />
                      {t('Google Meet-ზე შესვლა', 'Join Google Meet')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'hsl(var(--text-muted))', padding: '4rem 1rem' }}>
              <Zap size={32} style={{ color: 'rgba(255, 255, 255, 0.05)' }} />
              <span style={{ fontSize: '0.85rem' }}>{t('დღეს შეხვედრები არ გაქვთ დაგეგმილი', 'No meetings scheduled today')}</span>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
