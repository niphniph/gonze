import { useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { db } from '../utils/db';
import { googleService } from '../services/googleService';

const generateTaskId = () => `task-${Date.now()}`;

export const Tasks = ({ language }) => {
  const t = (ka, en) => (language === 'ka' ? ka : en);
  const [tasks, setTasks] = useState(() => db.getTasks() || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-06-07');
  const [category, setCategory] = useState('სამსახური 💼');
  const [priority, setPriority] = useState('🔴 მაღალი');
  const [status, setStatus] = useState('⚠️ არ დაგიწყია');
  const [comment, setComment] = useState('');

  const integrations = db.getIntegrations();
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [sendGmailInvites, setSendGmailInvites] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantInput, setParticipantInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const categories = ['ჯანმრთელობა 💪🏻', 'სამსახური 💼', 'ფული ₿', 'ოჯახი 👨‍👩‍👧‍👦', 'პირადი განვითარება 📚', 'საქმეები 🧹', 'იდეები 💡', 'დასვენება 🎮', 'სულიერება 🧘🏻'];
  const priorities = ['🔴 მაღალი', '🟡 საშუალო', '🔵 დაბალი', '⚪️ სურვილისამებრ'];
  const statuses = ['✅ შესრულებული', '✏️ პროგრესშია', '⚠️ არ დაგიწყია', '❌ გაუქმდა'];

  const translateCategory = (cat) => {
    if (language === 'ka') return cat;
    const map = { 'ჯანმრთელობა': 'Health', 'სამსახური': 'Work', 'ფული': 'Money', 'ოჯახი': 'Family', 'განვითარება': 'Development', 'საქმეები': 'Chores', 'იდეები': 'Ideas', 'დასვენება': 'Leisure', 'სულიერება': 'Spirituality' };
    for (const [k, v] of Object.entries(map)) { if (cat.includes(k)) return cat.replace(k, v); }
    return cat;
  };
  const translatePriority = (p) => { if (language === 'ka') return p; const map = { 'მაღალი': 'High', 'საშუალო': 'Medium', 'დაბალი': 'Low', 'სურვილისამებრ': 'Optional' }; for (const [k, v] of Object.entries(map)) { if (p.includes(k)) return p.replace(k, v); } return p; };
  const translateStatus = (s) => { if (language === 'ka') return s; const map = { 'შესრულებული': 'Completed', 'პროგრესშია': 'In Progress', 'არ დაგიწყია': 'Not Started', 'გაუქმდა': 'Cancelled' }; for (const [k, v] of Object.entries(map)) { if (s.includes(k)) return s.replace(k, v); } return s; };

  const updateTasksState = (newTasks) => { setTasks(newTasks); db.saveTasks(newTasks); };

  const handleToggleComplete = (id) => {
    const updated = tasks.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        return { ...task, completed, status: completed ? '✅ შესრულებული' : '✏️ პროგრესშია' };
      }
      return task;
    });
    updateTasksState(updated);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSyncLoading(true);
    let meetLink = "", isSynced = false, googleEventId = "";
    if (integrations.connected && syncToCalendar) {
      try {
        const res = await googleService.createCalendarEvent({ title: name.trim(), description: comment.trim(), date, time: "12:00", attendees: participants });
        if (res.success) {
          meetLink = res.meetLink; googleEventId = res.id; isSynced = true;
          if (sendGmailInvites && participants.length > 0) {
            await Promise.all(participants.map(email => googleService.sendGmailInvitation({ to: email, subject: `Task Invitation: ${name.trim()}`, body: `<h2>${name.trim()}</h2><p>Category: ${translateCategory(category)}</p>` })));
          }
        }
      } catch (err) { console.error("Google Calendar error:", err); }
    }
    const newTask = { id: generateTaskId(), name, date, category, priority, status, completed: status === '✅ შესრულებული', comment, meetLink, googleEventId, googleSynced: isSynced, participants };
    updateTasksState([newTask, ...tasks]);
    setSyncLoading(false);
    resetForm();
  };

  const handleStartEdit = (task) => {
    setEditingId(task.id); setName(task.name); setDate(task.date); setCategory(task.category);
    setPriority(task.priority); setStatus(task.status); setComment(task.comment || '');
    setSyncToCalendar(task.googleSynced || false); setParticipants(task.participants || []); setIsAdding(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSyncLoading(true);
    const existingTask = tasks.find(t => t.id === editingId);
    let meetLink = existingTask?.meetLink || "", googleEventId = existingTask?.googleEventId || "", isSynced = existingTask?.googleSynced || false;
    if (integrations.connected && syncToCalendar && !isSynced) {
      try {
        const res = await googleService.createCalendarEvent({ title: name.trim(), description: comment.trim(), date, time: "12:00", attendees: participants });
        if (res.success) { meetLink = res.meetLink; googleEventId = res.id; isSynced = true; }
      } catch (err) { console.error("Google Calendar error:", err); }
    }
    const updated = tasks.map(task => task.id === editingId ? { ...task, name, date, category, priority, status, completed: status === '✅ შესრულებული', comment, meetLink, googleEventId, googleSynced: isSynced, participants: participants.length > 0 ? participants : task.participants } : task);
    updateTasksState(updated);
    setSyncLoading(false);
    resetForm();
  };

  const handleDeleteTask = (id) => { updateTasksState(tasks.filter(task => task.id !== id)); };

  const resetForm = () => {
    setName(''); setDate('2026-06-07'); setCategory('სამსახური 💼'); setPriority('🔴 მაღალი');
    setStatus('⚠️ არ დაგიწყია'); setComment(''); setEditingId(null); setIsAdding(false);
    setSyncToCalendar(false); setSendGmailInvites(false); setParticipants([]); setParticipantInput('');
  };

  const filteredTasks = tasks.filter(task => {
    const matchCat = filterCategory === 'All' || task.category === filterCategory;
    const matchPri = filterPriority === 'All' || task.priority === filterPriority;
    const matchStat = filterStatus === 'All' || task.status === filterStatus;
    return matchCat && matchPri && matchStat;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getColor = (str, type) => {
    if (type === 'priority') {
      if (str.includes('მაღალი') || str === 'High') return 'text-error';
      if (str.includes('საშუალო') || str === 'Medium') return 'text-orange-400';
      if (str.includes('დაბალი') || str === 'Low') return 'text-primary-fixed-dim';
      return 'text-on-surface-variant';
    }
    if (str.includes('შესრულებული') || str === 'Completed') return 'text-green-400';
    if (str.includes('პროგრესში') || str === 'In Progress') return 'text-primary-fixed-dim';
    if (str.includes('არ დაგიწყია') || str === 'Not Started') return 'text-orange-400';
    if (str.includes('გაუქმდა') || str === 'Cancelled') return 'text-error';
    return 'text-on-surface-variant';
  };

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-7xl mx-auto space-y-stack-lg pb-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-2xl font-black text-primary-fixed-dim">{t('დავალებები', 'Tasks')}</h2>
          <p className="font-body-md text-on-surface-variant">{t('მართეთ ყოველდღიური და სამუშაო ამოცანები', 'Manage daily and work tasks')}</p>
        </div>
        <button onClick={() => { isAdding ? resetForm() : setIsAdding(true); }} className="bg-primary-fixed-dim text-on-primary-fixed px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer flex items-center gap-2 border-none shadow-lg shadow-primary-fixed-dim/20">
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          <span>{isAdding ? t('დახურვა', 'Close') : t('დავალების დამატება', 'Add Task')}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div>
            <p className="text-on-surface-variant text-sm">{t('საერთო პროგრესი', 'Overall Progress')}</p>
            <p className="font-display text-3xl font-bold text-on-surface">{completedCount} / {totalCount}</p>
          </div>
          <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary-fixed-dim rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="text-primary-fixed-dim font-bold text-sm">{completionPct}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim">
            <option value="All">{t('ყველა კატეგორია', 'All Categories')}</option>
            {categories.map(c => <option key={c} value={c}>{translateCategory(c)}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim">
            <option value="All">{t('ყველა პრიორიტეტი', 'All Priorities')}</option>
            {priorities.map(p => <option key={p} value={p}>{translatePriority(p)}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim">
            <option value="All">{t('ყველა სტატუსი', 'All Statuses')}</option>
            {statuses.map(s => <option key={s} value={s}>{translateStatus(s)}</option>)}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="glass-card rounded-xl p-6 md:p-8 border border-primary-fixed-dim/20">
          <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6">
            {editingId ? t('დავალების რედაქტირება', 'Edit Task') : t('ახალი დავალების შექმნა', 'Create New Task')}
          </h3>
          <form onSubmit={editingId ? handleSaveEdit : handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('დავალება', 'Task')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t("შეიყვანეთ დავალების დასახელება...", "Enter task name...")} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
              </div>
              <div>
                <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('თარიღი', 'Date')}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed-dim" required />
              </div>
              <div>
                <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('კატეგორია', 'Category')}</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  {categories.map(c => <option key={c} value={c}>{translateCategory(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('პრიორიტეტი', 'Priority')}</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  {priorities.map(p => <option key={p} value={p}>{translatePriority(p)}</option>)}
                </select>
              </div>
              <div>
                <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('სტატუსი', 'Status')}</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  {statuses.map(s => <option key={s} value={s}>{translateStatus(s)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">{t('კომენტარი', 'Comment')}</label>
              <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder={t("დაამატეთ შენიშვნა...", "Add comment...")} className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
            </div>
            {integrations.connected && (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 space-y-3">
                <p className="font-label text-[10px] text-primary-fixed-dim uppercase tracking-widest font-bold">Smart Google Automation</p>
                <div className="flex gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant">
                    <input type="checkbox" checked={syncToCalendar} onChange={e => setSyncToCalendar(e.target.checked)} className="accent-primary-fixed-dim" />
                    Create Google Calendar Event
                  </label>
                  {syncToCalendar && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant">
                      <input type="checkbox" checked={sendGmailInvites} onChange={e => setSendGmailInvites(e.target.checked)} className="accent-primary-fixed-dim" />
                      Send Email Invitation (via Gmail)
                    </label>
                  )}
                </div>
                {syncToCalendar && sendGmailInvites && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="email" value={participantInput} onChange={e => setParticipantInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setParticipants([...participants, participantInput]), setParticipantInput(''))} placeholder="invitee@example.com" className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                      <button type="button" onClick={() => { if (participantInput.trim()) { setParticipants([...participants, participantInput.trim()]); setParticipantInput(''); } }} className="bg-surface-container-highest text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer border border-outline-variant/30 hover:bg-surface-bright transition-all">+</button>
                    </div>
                    {participants.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {participants.map(p => (
                          <span key={p} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-3 py-1 text-xs text-on-surface-variant flex items-center gap-1">
                            {p}
                            <button type="button" onClick={() => setParticipants(participants.filter(x => x !== p))} className="text-error cursor-pointer bg-transparent border-none text-sm">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-4">
              <button type="button" onClick={resetForm} className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-bold text-sm hover:bg-surface-bright transition-all cursor-pointer border border-outline-variant/30">{t('გაუქმება', 'Cancel')}</button>
              <button type="submit" disabled={syncLoading} className="bg-primary-fixed-dim text-on-primary-fixed px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-container transition-all active:scale-95 cursor-pointer border-none" style={{ opacity: syncLoading ? 0.7 : 1 }}>
                {syncLoading ? t('მიმდინარეობს...', 'Syncing...') : t('შენახვა', 'Save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h3 className="font-headline-md text-xl font-bold text-on-surface mb-6">{t('დავალებების სია', 'Tasks List')} ({filteredTasks.length})</h3>
        <div className="space-y-4">
          {filteredTasks.length > 0 ? filteredTasks.map(task => (
            <div key={task.id} className={`flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:border-primary-fixed-dim/30 transition-all ${task.completed ? 'opacity-60' : ''}`}>
              <button onClick={() => handleToggleComplete(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer bg-transparent transition-colors ${task.completed ? 'border-green-400 bg-green-400/20' : 'border-outline hover:border-primary-fixed-dim'}`}>
                {task.completed && <span className="material-symbols-outlined text-green-400 text-sm">check</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-body-md font-bold ${task.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.name}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  <span className="font-label text-[10px] text-on-surface-variant">{translateCategory(task.category)}</span>
                  <span className={`font-label text-[10px] ${getColor(task.priority, 'priority')}`}>{translatePriority(task.priority)}</span>
                  <span className={`font-label text-[10px] ${getColor(task.status)}`}>{translateStatus(task.status)}</span>
                  <span className="font-label text-[10px] text-on-surface-variant">{task.date}</span>
                  {task.meetLink && <span className="font-label text-[10px] text-primary-fixed-dim">Google Meet</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleStartEdit(task)} className="text-on-surface-variant hover:text-primary-fixed-dim cursor-pointer bg-transparent border-none p-1"><Edit2 size={14} /></button>
                <button onClick={() => handleDeleteTask(task.id)} className="text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-on-surface-variant">{t('დავალებები ვერ მოიძებნა.', 'No tasks found.')}</div>
          )}
        </div>
      </div>
    </div>
  );
};
