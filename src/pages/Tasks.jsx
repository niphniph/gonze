import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Filter, BarChart2, Video, Mail, UserPlus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';
import { db } from '../utils/db';
import { googleService } from '../services/googleService';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';

export const Tasks = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [tasks, setTasks] = useState([]);
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-06-07');
  const [category, setCategory] = useState('სამსახური 💼');
  const [priority, setPriority] = useState('🔴 მაღალი');
  const [status, setStatus] = useState('⚠️ არ დაგიწყია');
  const [comment, setComment] = useState('');

  // Google Integration states
  const [integrations, setIntegrations] = useState({ connected: false });
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [createMeetLink, setCreateMeetLink] = useState(false);
  const [sendGmailInvites, setSendGmailInvites] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantInput, setParticipantInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Categories, Priorities, Statuses matching Excel
  const categories = [
    'ჯანმრთელობა 💪🏻', 'სამსახური 💼', 'ფული ₿', 
    'ოჯახი 👨‍👩‍👧‍👦', 'პირადი განვითარება 📚', 
    'საქმეები 🧹', 'იდეები 💡', 'დასვენება 🎮', 'სულიერება 🧘🏻'
  ];

  const priorities = ['🔴 მაღალი', '🟡 საშუალო', '🔵 დაბალი', '⚪️ სურვილისამებრ'];
  const statuses = ['✅ შესრულებული', '✏️ პროგრესშია', '⚠️ არ დაგიწყია', '❌ გაუქმდა'];

  const translateCategory = (cat) => {
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

  const translatePriority = (prio) => {
    if (language === 'ka') return prio;
    if (prio.includes('მაღალი')) return '🔴 High';
    if (prio.includes('საშუალო')) return '🟡 Medium';
    if (prio.includes('დაბალი')) return '🔵 Low';
    if (prio.includes('სურვილისამებრ')) return '⚪️ Optional';
    return prio;
  };

  const translateStatus = (stat) => {
    if (language === 'ka') return stat;
    if (stat.includes('შესრულებული')) return '✅ Completed';
    if (stat.includes('პროგრესშია')) return '✏️ In Progress';
    if (stat.includes('არ დაგიწყია')) return '⚠️ Not Started';
    if (stat.includes('გაუქმდა')) return '❌ Cancelled';
    return stat;
  };

  const translatePrioShort = (name) => {
    if (language === 'ka') return name;
    if (name === 'მაღალი') return 'High';
    if (name === 'საშუალო') return 'Medium';
    if (name === 'დაბალი') return 'Low';
    if (name === 'სურვილისამებრ') return 'Optional';
    return name;
  };

  const translateStatusShort = (name) => {
    if (language === 'ka') return name;
    if (name === 'შესრულებული') return 'Completed';
    if (name === 'პროგრესშია') return 'In Progress';
    if (name === 'არ დაგიწყია') return 'Not Started';
    if (name === 'გაუქმდა') return 'Cancelled';
    return name;
  };

  // Load tasks on mount
  useEffect(() => {
    setTasks(db.getTasks());
    setIntegrations(db.getIntegrations());
  }, []);

  // Sync tasks to local storage
  const updateTasksState = (newTasks) => {
    setTasks(newTasks);
    db.saveTasks(newTasks);
  };

  // Toggle checkbox
  const handleToggleComplete = (id) => {
    const updated = tasks.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        return {
          ...task,
          completed,
          status: completed ? '✅ შესრულებული' : '✏️ პროგრესშია'
        };
      }
      return task;
    });
    updateTasksState(updated);
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

  // Add task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSyncLoading(true);
    let meetLink = "";
    let isSynced = false;
    let googleEventId = "";

    if (integrations.connected && syncToCalendar) {
      try {
        const res = await googleService.createCalendarEvent({
          title: name.trim(),
          description: comment.trim(),
          date,
          time: "12:00",
          attendees: participants
        });
        if (res.success) {
          meetLink = res.meetLink;
          googleEventId = res.id;
          isSynced = true;

          if (sendGmailInvites && participants.length > 0) {
            const subject = `${t('დავალების მოწვევა: ', 'Task Invitation: ')}${name.trim()}`;
            const body = `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>${name.trim()}</h2>
                <p><strong>${t('კატეგორია:', 'Category:')}</strong> ${translateCategory(category)}</p>
                <p>${comment.trim() || t('დამატებითი აღწერის გარეშე.', 'No additional description.')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>${t('თარიღი:', 'Date:')}</strong> ${date}</p>
                ${meetLink ? `<p><strong>Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <small style="color: #666;">Sent automatically via Gonze Productivity Tracker</small>
              </div>
            `;
            await Promise.all(
              participants.map(email => googleService.sendGmailInvitation({ to: email, subject, body }))
            );
          }
        }
      } catch (err) {
        console.error("Google Calendar / Gmail error for task:", err);
        alert(t("Google კალენდართან სინქრონიზაციის შეცდომა: ", "Google Calendar sync error: ") + err.message);
      }
    }

    const newTask = {
      id: `task-${Date.now()}`,
      name,
      date,
      category,
      priority,
      status,
      completed: status === '✅ შესრულებული',
      comment,
      meetLink,
      googleEventId,
      googleSynced: isSynced,
      participants
    };

    updateTasksState([newTask, ...tasks]);
    setSyncLoading(false);
    resetForm();
  };

  // Edit task
  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setName(task.name);
    setDate(task.date);
    setCategory(task.category);
    setPriority(task.priority);
    setStatus(task.status);
    setComment(task.comment || '');
    setSyncToCalendar(task.googleSynced || false);
    setParticipants(task.participants || []);
    setIsAdding(true); // open form
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSyncLoading(true);
    let meetLink = "";
    let isSynced = false;
    let googleEventId = "";

    const existingTask = tasks.find(t => t.id === editingId);
    meetLink = existingTask?.meetLink || "";
    googleEventId = existingTask?.googleEventId || "";
    isSynced = existingTask?.googleSynced || false;

    if (integrations.connected && syncToCalendar && !isSynced) {
      try {
        const res = await googleService.createCalendarEvent({
          title: name.trim(),
          description: comment.trim(),
          date,
          time: "12:00",
          attendees: participants
        });
        if (res.success) {
          meetLink = res.meetLink;
          googleEventId = res.id;
          isSynced = true;

          if (sendGmailInvites && participants.length > 0) {
            const subject = `${t('დავალების მოწვევა: ', 'Task Invitation: ')}${name.trim()}`;
            const body = `
              <div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>${name.trim()}</h2>
                <p><strong>${t('კატეგორია:', 'Category:')}</strong> ${translateCategory(category)}</p>
                <p>${comment.trim() || t('დამატებითი აღწერის გარეშე.', 'No additional description.')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p><strong>${t('თარიღი:', 'Date:')}</strong> ${date}</p>
                ${meetLink ? `<p><strong>Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <small style="color: #666;">Sent automatically via Gonze Productivity Tracker</small>
              </div>
            `;
            await Promise.all(
              participants.map(email => googleService.sendGmailInvitation({ to: email, subject, body }))
            );
          }
        }
      } catch (err) {
        console.error("Google Calendar error for task edit:", err);
        alert(t("Google კალენდართან სინქრონიზაციის შეცდომა: ", "Google Calendar sync error: ") + err.message);
      }
    }

    const updated = tasks.map(task => {
      if (task.id === editingId) {
        return {
          ...task,
          name,
          date,
          category,
          priority,
          status,
          completed: status === '✅ შესრულებული',
          comment,
          meetLink,
          googleEventId,
          googleSynced: isSynced,
          participants: participants.length > 0 ? participants : task.participants
        };
      }
      return task;
    });

    updateTasksState(updated);
    setSyncLoading(false);
    resetForm();
  };

  // Delete task
  const handleDeleteTask = (id) => {
    const updated = tasks.filter(task => task.id !== id);
    updateTasksState(updated);
  };

  const resetForm = () => {
    setName('');
    setDate('2026-06-07');
    setCategory('სამსახური 💼');
    setPriority('🔴 მაღალი');
    setStatus('⚠️ არ დაგიწყია');
    setComment('');
    setEditingId(null);
    setIsAdding(false);
    
    // Reset Google form states
    setSyncToCalendar(false);
    setCreateMeetLink(false);
    setSendGmailInvites(false);
    setParticipants([]);
    setParticipantInput('');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchCat = filterCategory === 'All' || task.category === filterCategory;
    const matchPri = filterPriority === 'All' || task.priority === filterPriority;
    const matchStat = filterStatus === 'All' || task.status === filterStatus;
    return matchCat && matchPri && matchStat;
  });

  // Calculate completion percentage
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Chart Data: Status
  const statusCounts = {};
  statuses.forEach(s => { statusCounts[s] = 0; });
  tasks.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  const statusChartData = Object.keys(statusCounts).map(s => ({
    name: translateStatusShort(s.split(' ')[1] || s),
    value: statusCounts[s]
  })).filter(d => d.value > 0);

  // Chart Data: Priority
  const priorityCounts = {};
  priorities.forEach(p => { priorityCounts[p] = 0; });
  tasks.forEach(t => {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });
  const priorityChartData = Object.keys(priorityCounts).map(p => ({
    name: translatePrioShort(p.split(' ')[1] || p),
    value: priorityCounts[p]
  }));

  const PRIORITY_COLORS = {
    'მაღალი': 'hsl(var(--accent-rose))',
    'High': 'hsl(var(--accent-rose))',
    'საშუალო': 'hsl(var(--accent-amber))',
    'Medium': 'hsl(var(--accent-amber))',
    'დაბალი': 'hsl(var(--accent-blue))',
    'Low': 'hsl(var(--accent-blue))',
    'სურვილისამებრ': 'hsl(var(--text-muted))',
    'Optional': 'hsl(var(--text-muted))'
  };

  const STATUS_COLORS = {
    'შესრულებული': 'hsl(var(--accent-emerald))',
    'Completed': 'hsl(var(--accent-emerald))',
    'პროგრესშია': 'hsl(var(--accent-blue))',
    'In Progress': 'hsl(var(--accent-blue))',
    'არ დაგიწყია': 'hsl(var(--accent-amber))',
    'Not Started': 'hsl(var(--accent-amber))',
    'გაუქმდა': 'hsl(var(--accent-rose))',
    'Cancelled': 'hsl(var(--accent-rose))'
  };

  return (
    <div className="tasks-page">
      <header className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 800 }}>{t('დავალებები', 'Tasks')}</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>{t('მართეთ ყოველდღიური და სამუშაო ამოცანები', 'Manage daily and work tasks')}</p>
        </div>
        <button 
          onClick={() => { isAdding ? resetForm() : setIsAdding(true); }}
          className="btn btn-primary"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          <span>{isAdding ? t('დახურვა', 'Close') : t('დავალების დამატება', 'Add Task')}</span>
        </button>
      </header>

      {/* Task Add / Edit Modal-style Form */}
      {isAdding && (
        <GlassCard style={{ marginBottom: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>
            {editingId ? t('დავალების რედაქტირება', 'Edit Task') : t('ახალი დავალების შექმნა', 'Create New Task')}
          </h3>
          <form onSubmit={editingId ? handleSaveEdit : handleAddTask}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t('დავალება', 'Task')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t("შეიყვანეთ დავალების დასახელება...", "Enter task name...")} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('თარიღი', 'Date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('კატეგორია', 'Category')}</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(cat => <option key={cat} value={cat}>{translateCategory(cat)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('პრიორიტეტი', 'Priority')}</label>
                <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                  {priorities.map(prio => <option key={prio} value={prio}>{translatePriority(prio)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('სტატუსი', 'Status')}</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                  {statuses.map(stat => <option key={stat} value={stat}>{translateStatus(stat)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">{t('კომენტარი', 'Comment')}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t("დაამატეთ შენიშვნა...", "Add comment...")} 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
              />
            </div>

            {/* Google Integration options if connected */}
            {integrations.connected && (
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.03)', 
                border: '1px solid rgba(139, 92, 246, 0.1)', 
                borderRadius: '10px', 
                padding: '1rem',
                marginTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--primary-hover))', marginBottom: '0.25rem' }}>
                  Smart Google Automation
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input 
                      type="checkbox" 
                      checked={syncToCalendar} 
                      onChange={e => setSyncToCalendar(e.target.checked)}
                      style={{ accentColor: 'hsl(var(--primary))' }}
                    />
                    <span>Create Google Calendar Event</span>
                  </label>

                  {syncToCalendar && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input 
                        type="checkbox" 
                        checked={sendGmailInvites} 
                        onChange={e => setSendGmailInvites(e.target.checked)}
                        style={{ accentColor: 'hsl(var(--primary))' }}
                      />
                      <span>Send Email Invitation (via Gmail)</span>
                    </label>
                  )}
                </div>

                {/* Participants list for task */}
                {syncToCalendar && sendGmailInvites && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
                      {t('მოწვეული მონაწილეები', 'Invited Participants (Email)')}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="invitee@example.com" 
                        value={participantInput} 
                        onChange={e => setParticipantInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                        style={{ padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddParticipant} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>

                    {participants.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                        {participants.map(p => (
                          <span 
                            key={p} 
                            style={{ 
                              fontSize: '0.7rem', 
                              background: 'rgba(255, 255, 255, 0.05)', 
                              border: '1px solid var(--border-light)', 
                              padding: '0.15rem 0.4rem', 
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {p}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveParticipant(p)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--accent-rose))', fontSize: '0.65rem', padding: '0 0.1rem' }}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" onClick={resetForm} className="btn btn-secondary" disabled={syncLoading}>{t('გაუქმება', 'Cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={syncLoading}>
                {syncLoading ? t('მიმდინარეობს სინქრონიზაცია...', 'Syncing...') : t('შენახვა', 'Save')}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Stats Summary & Filters */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '2rem', alignItems: 'stretch' }}>
        <GlassCard style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.5rem' }}>{t('საერთო პროგრესი', 'Overall Progress')}</h4>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {completedCount} / {totalCount}
          </div>
          <ProgressBar progress={completionPct} />
        </GlassCard>

        {/* Filters */}
        <GlassCard>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} />
            <span>{t('ფილტრები', 'Filters')}</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>{t('კატეგორია', 'Category')}</label>
              <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="All">{t('ყველა კატეგორია', 'All Categories')}</option>
                {categories.map(cat => <option key={cat} value={cat}>{translateCategory(cat)}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>{t('პრიორიტეტი', 'Priority')}</label>
              <select className="form-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="All">{t('ყველა პრიორიტეტი', 'All Priorities')}</option>
                {priorities.map(prio => <option key={prio} value={prio}>{translatePriority(prio)}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>{t('სტატუსი', 'Status')}</label>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">{t('ყველა სტატუსი', 'All Statuses')}</option>
                {statuses.map(stat => <option key={stat} value={stat}>{translateStatus(stat)}</option>)}
              </select>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Main Grid: List and Analytics Charts */}
      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Task List */}
        <GlassCard style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t('დავალებების სია', 'Tasks List')} ({filteredTasks.length})</h3>
          
          {filteredTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredTasks.map(task => {
                const taskPrioName = task.priority.split(' ')[1] || task.priority;
                const taskStatName = task.status.split(' ')[1] || task.status;
                const prioColor = PRIORITY_COLORS[taskPrioName] || 'hsl(var(--text-secondary))';
                const statColor = STATUS_COLORS[taskStatName] || 'hsl(var(--text-secondary))';

                return (
                  <div 
                    key={task.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      transition: 'all 0.2s',
                      opacity: task.completed ? 0.65 : 1
                    }}
                  >
                    {/* Left: Checkbox + Name + Comment */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <label className="checkbox-container" style={{ cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          className="checkbox-input"
                          checked={task.completed} 
                          onChange={() => handleToggleComplete(task.id)} 
                        />
                        <span className="checkbox-custom" />
                      </label>
                      <div style={{ minWidth: 0, paddingRight: '1rem' }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'hsl(var(--text-muted))' : 'hsl(var(--text-primary))',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.name}
                        </div>
                        {task.comment && (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>
                            {task.comment}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.04)', color: 'hsl(var(--text-secondary))' }}>
                            {translateCategory(task.category)}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.04)', color: 'hsl(var(--text-muted))' }}>
                            {task.date}
                          </span>
                          {task.googleSynced && (
                            <span style={{ 
                              fontSize: '0.65rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px', 
                              background: 'rgba(139, 92, 246, 0.1)', 
                              color: 'hsl(var(--primary-hover))', 
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}>
                              Google Synced
                            </span>
                          )}
                          {task.meetLink && (
                            <a 
                              href={task.meetLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ 
                                fontSize: '0.65rem', 
                                padding: '0.1rem 0.4rem', 
                                borderRadius: '4px', 
                                background: 'rgba(14, 165, 233, 0.15)', 
                                color: 'hsl(var(--accent-blue))', 
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                textDecoration: 'none'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Video size={10} />
                              Join Meet
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Badges + Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }} className="desktop-badges">
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: prioColor }}>
                          {translatePriority(task.priority)}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: statColor }}>
                          {translateStatus(task.status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          onClick={() => handleStartEdit(task)} 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.35rem', color: 'hsl(var(--text-secondary))' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.35rem', color: 'hsl(var(--accent-rose))' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              {t('დავალებები ვერ მოიძებნა ამ ფილტრებით.', 'No tasks found matching these filters.')}
            </div>
          )}
        </GlassCard>

        {/* Charts Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Priority Chart */}
          <GlassCard style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} style={{ color: 'hsl(var(--primary))' }} />
              <span>{t('დავალებები პრიორიტეტით', 'Tasks by Priority')}</span>
            </h4>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={10} tickLine={false} />
                  <YAxis stroke="hsl(var(--text-muted))" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--bg-surface-elevated))', 
                      borderColor: 'var(--border-light)', 
                      borderRadius: '8px',
                      color: 'hsl(var(--text-primary))'
                    }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((entry, index) => {
                      const color = PRIORITY_COLORS[entry.name] || 'hsl(var(--primary))';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Status Chart */}
          <GlassCard style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} style={{ color: 'hsl(var(--accent-blue))' }} />
              <span>{t('დავალებები სტატუსით', 'Tasks by Status')}</span>
            </h4>
            <div style={{ width: '100%', height: '180px' }}>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => {
                        const color = STATUS_COLORS[entry.name] || 'hsl(var(--primary))';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--bg-surface-elevated))', 
                        borderColor: 'var(--border-light)', 
                        borderRadius: '8px',
                        color: 'hsl(var(--text-primary))'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  {t('მონაცემები არ არის', 'No data available')}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};
