import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { db } from '../utils/db';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';

export const Habits = () => {
  const [habitsList, setHabitsList] = useState([]);
  const [habitHistory, setHabitHistory] = useState({});

  // Add habit form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('ჯანმრთელობა 💪');
  const [isAdding, setIsAdding] = useState(false);

  // Month definition (June 2026)
  const currentYear = 2026;
  const currentMonthIdx = 5; // June (0-indexed)
  const monthDaysCount = 30;
  const monthName = "ივნისი";

  useEffect(() => {
    const data = db.getHabits();
    setHabitsList(data.list);
    setHabitHistory(data.history || {});
  }, []);

  const updateHabitsState = (newList, newHistory) => {
    setHabitsList(newList);
    setHabitHistory(newHistory);
    db.saveHabits(newList, newHistory);
  };

  // Toggle habit check for a specific date
  const handleToggleHabit = (habitId, dateStr) => {
    const updatedHistory = { ...habitHistory };
    
    if (!updatedHistory[habitId]) {
      updatedHistory[habitId] = {};
    }

    updatedHistory[habitId][dateStr] = !updatedHistory[habitId][dateStr];
    updateHabitsState(habitsList, updatedHistory);
  };

  // Add new habit
  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const habitId = `habit-${Date.now()}`;
    const newHabit = {
      id: habitId,
      name: newHabitName,
      category: newHabitCategory
    };

    const updatedList = [...habitsList, newHabit];
    const updatedHistory = { ...habitHistory };
    updatedHistory[habitId] = {};

    updateHabitsState(updatedList, updatedHistory);
    setNewHabitName('');
    setIsAdding(false);
  };

  // Delete habit
  const handleDeleteHabit = (habitId) => {
    const updatedList = habitsList.filter(h => h.id !== habitId);
    const updatedHistory = { ...habitHistory };
    delete updatedHistory[habitId];
    updateHabitsState(updatedList, updatedHistory);
  };

  // Generate date strings for June 1-30, 2026
  const getJuneDates = () => {
    const dates = [];
    for (let d = 1; d <= monthDaysCount; d++) {
      const dateStr = `${currentYear}-06-${String(d).padStart(2, '0')}`;
      const dayObj = new Date(currentYear, currentMonthIdx, d);
      const dayName = dayObj.toLocaleDateString('ka-GE', { weekday: 'short' });
      dates.push({ dateStr, label: `${dayName} ${d}`, dayNum: d });
    }
    return dates;
  };
  
  const juneDates = getJuneDates();

  // Get date strings for the past 7 days (June 1 - June 7, 2026)
  const getPast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx, 7);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('ka-GE', { weekday: 'short' }) + ' ' + d.getDate();
      dates.push({ dateStr, label });
    }
    return dates;
  };

  const past7Days = getPast7Days();

  // Calculations for charts
  const getHabitCompletionStats = (habitId) => {
    const checks = habitHistory[habitId] || {};
    let juneChecks = 0;
    
    juneDates.forEach(d => {
      if (checks[d.dateStr]) {
        juneChecks++;
      }
    });

    const completionRate = Math.round((juneChecks / monthDaysCount) * 100);
    return { count: juneChecks, rate: completionRate };
  };

  // Generate chart data comparing all habits for June
  const chartData = habitsList.map(h => {
    const stats = getHabitCompletionStats(h.id);
    return {
      name: h.name.length > 12 ? h.name.slice(0, 10) + '...' : h.name,
      rate: stats.rate,
      fullName: h.name
    };
  });

  return (
    <div className="habits-page">
      <header className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>ჩვევები</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>ჩამოაყალიბეთ სასარგებლო ჩვევები ყოველდღიური თვალყურის დევნებით</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="btn btn-primary"
        >
          {isAdding ? 'გაუქმება' : 'ჩვევის დამატება'}
        </button>
      </header>

      {/* Add Habit Card */}
      {isAdding && (
        <GlassCard style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>ახალი ჩვევის დამატება</h3>
          <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
              <label className="form-label">ჩვევის სახელი (მაგ. ვარჯიში 💪)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="შეიყვანეთ ჩვევა..." 
                value={newHabitName} 
                onChange={e => setNewHabitName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
              <label className="form-label">კატეგორია</label>
              <select className="form-select" value={newHabitCategory} onChange={e => setNewHabitCategory(e.target.value)}>
                <option value="ჯანმრთელობა 💪">ჯანმრთელობა 💪</option>
                <option value="განვითარება 📖">განვითარება 📖</option>
                <option value="პირადი 🗓️">პირადი 🗓️</option>
                <option value="ფინანსები 💰">ფინანსები 💰</option>
                <option value="სამსახური 🎯">სამსახური 🎯</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">დამატება</button>
          </form>
        </GlassCard>
      )}

      {/* Habits Analytics Chart */}
      {habitsList.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <GlassCard style={{ minHeight: '260px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>ჩვევების პროგრესი ივნისში (%)</h3>
            <div style={{ width: '100%', height: '200px' }}>
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
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.5 + (entry.rate / 200)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Main Layout: List of habits & Quick checks */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={18} style={{ color: 'hsl(var(--primary))' }} />
        <span>კვირის სწრაფი პანელი (ბოლო 7 დღე)</span>
      </h3>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
        {habitsList.length > 0 ? (
          habitsList.map(habit => {
            const stats = getHabitCompletionStats(habit.id);
            return (
              <GlassCard 
                key={habit.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  gap: '1.5rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Info block */}
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🏆</span>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{habit.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{habit.category}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ flex: '1 1 180px' }}>
                  <ProgressBar progress={stats.rate} />
                </div>

                {/* Quick Checkboxes for last 7 days */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {past7Days.map(d => {
                    const isChecked = habitHistory[habit.id]?.[d.dateStr] || false;
                    return (
                      <div 
                        key={d.dateStr}
                        onClick={() => handleToggleHabit(habit.id, d.dateStr)}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          padding: '0.4rem 0.5rem',
                          borderRadius: '8px',
                          border: isChecked ? '1px solid hsl(var(--accent-emerald) / 0.4)' : '1px solid var(--border-light)',
                          background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          minWidth: '50px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.25rem' }}>
                          {d.label}
                        </span>
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

                {/* Actions */}
                <button 
                  onClick={() => handleDeleteHabit(habit.id)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '0.5rem', 
                    color: 'hsl(var(--accent-rose))' 
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </GlassCard>
            );
          })
        ) : (
          <GlassCard style={{ padding: '3rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            ჯერ ჩვევები არ დამატებულა. ჩაამატეთ ზედა ღილაკით!
          </GlassCard>
        )}
      </section>

      {/* Complete Monthly Grid Matrix */}
      {habitsList.length > 0 && (
        <section>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'hsl(var(--accent-blue))' }} />
            <span>ივნისის ყოველთვიური მატრიცა ({monthName} 2026)</span>
          </h3>
          
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, background: 'hsl(var(--bg-surface))', borderRight: '1px solid var(--border-light)' }}>ჩვევა</th>
                    {juneDates.map(d => (
                      <th key={d.dateStr} style={{ padding: '0.5rem', textAlign: 'center', minWidth: '50px', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habitsList.map(habit => (
                    <tr key={habit.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {/* Stick row header */}
                      <td style={{ 
                        padding: '1rem', 
                        fontWeight: 600, 
                        position: 'sticky', 
                        left: 0, 
                        background: 'hsl(var(--bg-surface))', 
                        borderRight: '1px solid var(--border-light)',
                        boxShadow: '4px 0 8px -4px rgba(0,0,0,0.3)'
                      }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                          {habit.name}
                        </div>
                      </td>
                      {/* Ticks */}
                      {juneDates.map(d => {
                        const isChecked = habitHistory[habit.id]?.[d.dateStr] || false;
                        return (
                          <td key={d.dateStr} style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <label className="checkbox-container" style={{ display: 'inline-flex', marginRight: 0 }}>
                              <input 
                                type="checkbox" 
                                className="checkbox-input"
                                checked={isChecked} 
                                onChange={() => handleToggleHabit(habit.id, d.dateStr)} 
                              />
                              <span className="checkbox-custom" style={{ marginRight: 0 }} />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      )}
    </div>
  );
};
